// ==UserScript==
// @name         BHL Giveaway Extractor
// @namespace    https://bhl-website.vercel.app/
// @version      3.1.0
// @description  Capture the unique commenters of a Brotherhood Legacy giveaway on Instagram or Facebook into the JSON the BHL admin dashboard imports.
// @author       Brotherhood Legacy
// @match        https://www.instagram.com/*
// @match        https://www.facebook.com/*
// @match        https://web.facebook.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * HOW TO USE
 *   1. Log in as the account that posted the giveaway (Instagram and/or Facebook).
 *   2. Open the giveaway post. The "BHL Giveaway" panel appears bottom-right while a post is open.
 *   3. Click "Capture entrants" and leave the tab alone until it says Done.
 *   4. Click Download (or Copy) and import the file in
 *      BHL Admin -> Giveaways -> Entrants -> Import.
 *      Do this once for Instagram and once for Facebook — both go into the same draw.
 *
 * WHAT IT CAPTURES
 *   Every comment on the post, collapsed to one entry per account (commenting ten times still
 *   counts once), plus the friends each person tagged. Your own comments are left out.
 *   - Instagram: top-level comments, read from Instagram's own data feed.
 *   - Facebook: comments AND replies, read from the page after the script switches the post to
 *     "All comments" and opens every "View more comments" / "View replies". It only ever clicks
 *     those expand buttons — never Like, Reply or Share.
 *   Follows and likes are NOT captured: check your winners by hand before publishing.
 *
 * NOTE ON FRAGILITY
 *   These read Instagram's and Facebook's own web pages, not a documented API, and either can
 *   change without notice. Facebook is the more fragile of the two. If the Facebook capture
 *   misses comments, set Facebook's language to English and try again.
 */

(function () {
  'use strict';

  const IS_FACEBOOK = /(^|\.)facebook\.com$/.test(location.hostname);

  // --- Shared helpers -----------------------------------------------------
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function cookie(name) {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  // ========================================================================
  // Instagram
  // ========================================================================
  const IG = (() => {
    const PAGE_DELAY_MS = 1200;     // Between successive pages of comments.
    const BACKOFF_MS = 60_000;      // How long to wait after a 429 before retrying.
    const MAX_RETRIES = 3;

    // The web app id Instagram's own frontend sends. Read from the page when possible
    // so this keeps working if Instagram rotates it; the constant is only a fallback.
    const FALLBACK_APP_ID = '936619743392459';
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

    function appId() {
      const match = document.documentElement.innerHTML.match(/"X-IG-App-ID"\s*:\s*"(\d+)"/);
      return (match && match[1]) || FALLBACK_APP_ID;
    }

    function shortcodeFromUrl() {
      const match = location.pathname.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
      return match ? match[1] : null;
    }

    /** Instagram shortcodes are base64 of the numeric media pk — derived offline, no request. */
    function shortcodeToMediaId(shortcode) {
      let id = BigInt(0);
      for (const char of shortcode) {
        const index = B64.indexOf(char);
        if (index === -1) return null;
        id = id * BigInt(64) + BigInt(index);
      }
      return id > BigInt(0) ? id.toString() : null;
    }

    /** Same-origin fetch carrying the logged-in session, with 429 backoff. */
    async function igFetch(path, attempt = 0) {
      const res = await fetch(`https://www.instagram.com${path}`, {
        credentials: 'include',
        headers: {
          'X-IG-App-ID': appId(),
          'X-CSRFToken': cookie('csrftoken') || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (res.status === 429) {
        if (attempt >= MAX_RETRIES) throw new Error('Rate limited by Instagram — stopped. Try again later.');
        log(`Rate limited. Backing off ${BACKOFF_MS / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await sleep(BACKOFF_MS);
        return igFetch(path, attempt + 1);
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error('Instagram rejected the request — make sure you are logged in as the post owner.');
      }
      if (!res.ok) throw new Error(`Instagram returned ${res.status} for ${path}`);

      // Logged out, Instagram answers 200 with its HTML login page instead of JSON.
      const type = res.headers.get('content-type') || '';
      if (!type.includes('json')) {
        throw new Error('Instagram sent its login page instead of data — log in as the post owner and try again.');
      }

      return res.json();
    }

    /** The post owner, so their own replies can be left out of the entrants. */
    async function fetchOwnerUsername(mediaId) {
      try {
        const data = await igFetch(`/api/v1/media/${mediaId}/info/`);
        const item = data && data.items && data.items[0];
        return (item && item.user && item.user.username) || null;
      } catch (err) {
        log(`Could not read the post owner (${err.message}). The site will still drop them if it knows them.`);
        return null;
      }
    }

    async function fetchComments(mediaId, onProgress) {
      const rows = [];
      const seenCommentIds = new Set();
      let cursor = null;
      let page = 0;

      for (;;) {
        const params = new URLSearchParams({ can_support_threading: 'true', permalink_enabled: 'false' });
        if (cursor) params.set(cursor.param, cursor.value);
        const data = await igFetch(`/api/v1/media/${mediaId}/comments/?${params}`);

        const batch = Array.isArray(data.comments) ? data.comments : [];
        let fresh = 0;
        for (const comment of batch) {
          const key = String(comment.pk || comment.id || '');
          if (key && seenCommentIds.has(key)) continue;
          if (key) seenCommentIds.add(key);
          fresh += 1;

          const user = comment.user || {};
          // Deleted/restricted accounts come back without a username — skip rather than crash.
          if (!user.username) continue;
          rows.push({
            username: String(user.username).toLowerCase(),
            userId: user.pk != null ? String(user.pk) : undefined,
            fullName: user.full_name || undefined,
            profilePicUrl: user.profile_pic_url || undefined,
            text: typeof comment.text === 'string' ? comment.text : '',
          });
        }

        page += 1;
        onProgress(rows.length, page);

        // Instagram has used both cursor styles on this endpoint; follow whichever it sends.
        if (data.next_min_id) cursor = { param: 'min_id', value: data.next_min_id };
        else if (data.next_max_id) cursor = { param: 'max_id', value: data.next_max_id };
        else break;

        // A page of only already-seen comments means the cursor stopped advancing.
        if (batch.length === 0 || fresh === 0) break;
        await sleep(PAGE_DELAY_MS);
      }

      return rows;
    }

    async function capture() {
      const shortcode = shortcodeFromUrl();
      if (!shortcode) throw new Error('Open the giveaway post first.');

      const mediaId = shortcodeToMediaId(shortcode);
      if (!mediaId) throw new Error(`Could not derive a media id from "${shortcode}".`);
      log(`Instagram post ${shortcode} -> media ${mediaId}`);

      const ownerUsername = await fetchOwnerUsername(mediaId);
      if (ownerUsername) log(`Owner: @${ownerUsername} (their comments are left out)`);

      log('Fetching comments...');
      const rows = await fetchComments(mediaId, (count, page) =>
        setStatus(`Fetching comments... ${count} from ${page} page${page === 1 ? '' : 's'}`)
      );

      const entrants = uniqueEntrants(rows, ownerUsername ? [ownerUsername.toLowerCase()] : []);
      log(`${rows.length} comments -> ${entrants.length} unique accounts.`);

      return {
        version: 2,
        platform: 'instagram',
        postUrl: `https://www.instagram.com/p/${shortcode}/`,
        postId: mediaId,
        capturedAt: new Date().toISOString(),
        ownerUsername: ownerUsername || undefined,
        entrants,
      };
    }

    return { isPostView: () => !!shortcodeFromUrl(), capture, fileTag: () => shortcodeFromUrl() };
  })();

  // ========================================================================
  // Facebook
  // ========================================================================
  const FB = (() => {
    const CLICK_DELAY_MS = 900;       // Between expand clicks, so Facebook can load each batch.
    const MAX_CLICKS = 800;           // Safety cap for huge threads.
    const MAX_RUNTIME_MS = 8 * 60_000;
    const IDLE_ROUNDS_TO_FINISH = 4;  // Consecutive "nothing left to open" checks before stopping.

    // Button wording differs per Facebook language; these cover English, French, Arabic, Spanish.
    const FILTER_BUTTON_RE = /^(most relevant|top comments|newest|all comments|plus pertinents|les plus pertinents|plus récents|tous les commentaires|الأكثر صلة|الأحدث|كل التعليقات|más relevantes|más recientes|todos los comentarios)\b/i;
    const ALL_COMMENTS_RE = /^(all comments|tous les commentaires|كل التعليقات|todos los comentarios)/i;
    const SEE_MORE_TEXT_RE = /^(see more|voir plus|عرض المزيد|ver más)$/i;
    const COMMENT_WORD_RE = /(comment|repl|répon|commentaire|تعليق|رد|ردود|comentario|respuesta)/i;
    const MORE_WORD_RE = /(\d|more|previous|view|see|plus|précédent|autres|afficher|voir|المزيد|السابقة|عرض|más|anteriores|ver)/i;
    // A bare count like "12 comments" toggles the whole comment list — never click it.
    const BARE_COUNT_RE = /^\d[\d.,\s]*[kKmM]?\s*(comments?|commentaires?|تعليقات?|تعليقًا|comentarios?)$/i;

    const RESERVED_PATHS = new Set([
      'hashtag', 'groups', 'pages', 'photo', 'photo.php', 'photos', 'watch', 'stories', 'events', 'reel',
      'reels', 'share', 'permalink.php', 'story.php', 'marketplace', 'gaming', 'help', 'settings',
      'login', 'login.php', 'notifications', 'messages', 'friends', 'bookmarks', 'search', 'ads',
      'business', 'privacy', 'policies', 'l.php', 'sharer', 'sharer.php', 'dialog', 'media', 'video',
      'videos', 'posts', 'home.php', 'me', 'profile.php', 'people', 'saved', 'memories', 'feeds',
    ]);

    /**
     * Stable account key from a profile link: fb:id:<number>, fb:pf:<pfbid…> or fb:<vanity>.
     * Accounts without a username are linked as /people/<Name>/pfbid…/ — those are very common
     * on giveaway posts, and missing them used to hand the entry to the first friend they tagged.
     */
    function profileKey(href) {
      let url;
      try {
        url = new URL(href, location.origin);
      } catch {
        return null;
      }
      if (!/(^|\.)facebook\.com$/.test(url.hostname)) return null;
      const parts = url.pathname.split('/').filter(Boolean);

      if (parts[0] === 'profile.php') {
        const id = url.searchParams.get('id');
        return id && /^\d{5,20}$/.test(id) ? `fb:id:${id}` : null;
      }
      if (parts[0] === 'people' && /^\d{5,20}$/.test(parts[2] || '')) return `fb:id:${parts[2]}`;
      if (parts[0] === 'people' && /^pfbid[A-Za-z0-9]{10,120}$/.test(parts[2] || '')) return `fb:pf:${parts[2]}`;
      if (parts[0] === 'groups' && parts[2] === 'user' && /^\d{5,20}$/.test(parts[3] || '')) return `fb:id:${parts[3]}`;

      if (parts.length === 1 && !RESERVED_PATHS.has(parts[0].toLowerCase()) && /^[a-z0-9.]{3,80}$/i.test(parts[0])) {
        return /^\d{5,20}$/.test(parts[0]) ? `fb:id:${parts[0]}` : `fb:${parts[0].toLowerCase()}`;
      }
      return null;
    }

    /** The open post: a post dialog if one is showing comments, otherwise the main column. */
    function root() {
      const dialogs = [...document.querySelectorAll('div[role="dialog"]')].filter(d =>
        d.querySelector('div[role="article"]')
      );
      return dialogs[dialogs.length - 1] || document.querySelector('div[role="main"]') || document.body;
    }

    function isPostView() {
      if (/\/(posts|permalink\.php|story\.php|photo|photos|videos|reel|watch|share)\b|[?&](story_fbid|fbid)=/.test(location.href)) {
        return true;
      }
      return [...document.querySelectorAll('div[role="dialog"]')].some(d => d.querySelector('div[role="article"]'));
    }

    function commentArticles(scope) {
      // Comment blocks carry an aria-label ("Comment by …"); the post itself doesn't.
      return [...scope.querySelectorAll('div[role="article"][aria-label]')];
    }

    function textOf(el) {
      return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Facebook ignores a lone synthetic "click" on some controls, so send the full press sequence
     * a real click produces. Only ever called on the comment filter and expand buttons.
     */
    function click(el) {
      el.scrollIntoView({ block: 'center' });
      const init = { bubbles: true, cancelable: true, composed: true, button: 0 };
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
        const Event = type.startsWith('pointer') && typeof PointerEvent === 'function' ? PointerEvent : MouseEvent;
        el.dispatchEvent(new Event(type, init));
      }
      el.click();
    }

    /** The element that actually scrolls the comments (the post dialog's inner panel, or the page). */
    function scrollerFor(scope) {
      const last = commentArticles(scope).pop();
      for (let node = last && last.parentElement; node && node !== document.body; node = node.parentElement) {
        const { overflowY } = getComputedStyle(node);
        if (/(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight + 10) return node;
      }
      return document.scrollingElement;
    }

    /** Switch the comment filter from "Most relevant" to "All comments" so nothing is hidden. */
    async function showAllComments(scope) {
      // The sort control can sit outside the comment list, so look across the whole page.
      const filter = [...scope.querySelectorAll('[role="button"]'), ...document.querySelectorAll('[role="button"]')]
        .find(b => textOf(b).length < 40 && FILTER_BUTTON_RE.test(textOf(b)));
      if (!filter) {
        log('No comment filter found — continuing with what Facebook shows.');
        return;
      }
      if (ALL_COMMENTS_RE.test(textOf(filter))) return;

      click(filter);
      await sleep(900);
      const items = [...document.querySelectorAll('[role="menuitem"], [role="menuitemradio"]')];
      const all = items.find(i => ALL_COMMENTS_RE.test(textOf(i))) || items[items.length - 1];
      if (!all) {
        log('Could not open the comment filter — continuing with what Facebook shows.');
        return;
      }
      click(all);
      log('Switched to "All comments".');
      await sleep(1800);
    }

    function isExpander(el) {
      if (el.closest('a')) return false;             // never follow links
      if (el.hasAttribute('aria-pressed')) return false; // toggles like Like
      const text = textOf(el);
      if (!text || text.length > 60) return false;
      if (SEE_MORE_TEXT_RE.test(text)) return true;  // expands a long comment so its tags are readable
      if (BARE_COUNT_RE.test(text)) return false;
      return COMMENT_WORD_RE.test(text) && MORE_WORD_RE.test(text);
    }

    /**
     * Keep opening "View more comments" / "View N replies" until there's nothing left.
     * Returns the buttons that were clicked but didn't open, so the panel can say what's missing.
     */
    async function expandEverything(scope, onProgress) {
      const clicked = new WeakSet();
      const stuck = [];
      const started = Date.now();
      let clicks = 0;
      let idle = 0;

      while (idle < IDLE_ROUNDS_TO_FINISH && clicks < MAX_CLICKS && Date.now() - started < MAX_RUNTIME_MS) {
        const next = [...scope.querySelectorAll('[role="button"]')].find(b => !clicked.has(b) && isExpander(b));
        if (next) {
          const text = textOf(next);
          clicked.add(next);
          click(next);
          clicks += 1;
          idle = 0;
          onProgress(commentArticles(scope).length, clicks);
          await sleep(CLICK_DELAY_MS);
          // A button that worked disappears or changes; one still showing the same text didn't open.
          // It's never clicked twice, since a second click could collapse what did open.
          if (next.isConnected && textOf(next) === text && !SEE_MORE_TEXT_RE.test(text)) stuck.push(text);
          continue;
        }

        // Nothing visible to open: scroll the comment list to its end so Facebook loads the next
        // batch and renders lazy buttons, then look again.
        idle += 1;
        const scroller = scrollerFor(scope);
        const last = commentArticles(scope).pop();
        if (last) last.scrollIntoView({ block: 'end' });
        scroller.scrollTop = scroller.scrollHeight;
        await sleep(1800);
      }

      if (clicks >= MAX_CLICKS || Date.now() - started >= MAX_RUNTIME_MS) {
        log('Stopped expanding at the safety limit — very large threads may be incomplete.');
      }
      return stuck;
    }

    /** A /people/<Name>/pfbid…/ link can't be rebuilt from its key (pfbids are case-sensitive), so keep it. */
    function peopleUrl(href) {
      try {
        const url = new URL(href, location.origin);
        return /^\/people\/[^/]+\/pfbid[A-Za-z0-9]+\/?$/.test(url.pathname) ? `https://www.facebook.com${url.pathname}` : undefined;
      } catch {
        return undefined;
      }
    }

    /**
     * Returns { rows, skipped }. A comment is only kept when its commenter is certain: the first
     * link in the block (their avatar/name) must be a profile, and that name must appear in the
     * block's own label ("Comment by <name> …"). Otherwise it's skipped and counted, never
     * handed to someone else.
     */
    function readComments(scope, ownerKeys) {
      const rows = [];
      let skipped = 0;
      for (const article of commentArticles(scope)) {
        const own = [...article.querySelectorAll('a[href]')].filter(a => a.closest('div[role="article"]') === article);
        const key = own[0] ? profileKey(own[0].href) : null;
        const nameLink = key ? own.find(a => profileKey(a.href) === key && textOf(a)) : null;
        const label = article.getAttribute('aria-label') || '';
        if (!key || !nameLink || !label.includes(textOf(nameLink))) {
          skipped += 1;
          continue;
        }
        if (ownerKeys.includes(key)) continue;

        // Tags: every other person linked inside this comment (replies are separate comment blocks).
        // This doesn't depend on where Facebook puts the timestamp, which moves between layouts.
        const tagged = own.map(a => profileKey(a.href)).filter(k => k && k !== key);

        // Comment text, for the audit trail only: the first text block that isn't the name line.
        const body = [...article.querySelectorAll('div[dir="auto"]')].find(el =>
          el.closest('div[role="article"]') === article && !el.contains(nameLink) && textOf(el)
        );

        rows.push({
          username: key,
          fullName: textOf(nameLink),
          profileUrl: peopleUrl(nameLink.href),
          text: body ? textOf(body) : own.filter(a => profileKey(a.href) && profileKey(a.href) !== key).map(textOf).join(' '),
          mentions: [...new Set(tagged)],
        });
      }
      return { rows, skipped };
    }

    function ownerKeys(scope) {
      const keys = [];
      const me = cookie('c_user'); // the logged-in account, i.e. whoever posted on their own profile
      if (me && /^\d{5,20}$/.test(me)) keys.push(`fb:id:${me}`);

      // The post author's link sits above the comments, outside every comment block.
      const commentBlocks = commentArticles(scope);
      const authorLink = [...scope.querySelectorAll('a[href]')].find(a =>
        profileKey(a.href) && textOf(a) && !commentBlocks.some(c => c.contains(a))
      );
      if (authorLink) keys.push(profileKey(authorLink.href));
      return [...new Set(keys)];
    }

    function cleanPostUrl() {
      const url = new URL(location.href);
      const keep = new URLSearchParams();
      for (const param of ['story_fbid', 'fbid', 'id', 'v']) {
        if (url.searchParams.has(param)) keep.set(param, url.searchParams.get(param));
      }
      const query = keep.toString();
      return `${url.origin}${url.pathname}${query ? `?${query}` : ''}`;
    }

    async function capture() {
      if (!cookie('c_user')) throw new Error('Log in to Facebook first.');
      const scope = root();

      await showAllComments(scope);

      log('Opening every comment and reply...');
      const stuck = await expandEverything(scope, (count, clicks) => setStatus(`Opening comments... ${count} loaded (${clicks} expanded)`));

      const owners = ownerKeys(scope);
      const { rows, skipped } = readComments(scope, owners);
      if (skipped > 0) {
        log(`Skipped ${skipped} comment(s) whose author couldn't be identified for certain (deleted accounts, or Facebook changed its layout).`);
      }
      if (rows.length === 0) {
        throw new Error('No comments found. Open the post itself (not the feed) and try again, or switch Facebook to English.');
      }

      const entrants = uniqueEntrants(rows, owners);
      const tagged = entrants.filter(e => e.mentions.length > 0).length;
      log(`${rows.length} comments -> ${entrants.length} unique accounts (${tagged} tagged at least one friend).`);

      // Say plainly what might be missing, so a bad capture is never silently imported.
      const unopened = [...scope.querySelectorAll('[role="button"]')].filter(isExpander).map(textOf)
        .filter(t => !SEE_MORE_TEXT_RE.test(t));
      if (stuck.length || unopened.length) {
        const sample = [...new Set([...stuck, ...unopened])].slice(0, 4).join(' | ');
        log(`Warning: ${stuck.length + unopened.length} comment button(s) didn't open (${sample}). Some comments may be missing — try Capture again.`);
      }
      if (rows.length >= 5 && tagged === 0) {
        // Diagnostic for when Facebook's markup changes: what links the first comment actually has.
        const first = commentArticles(scope)[0];
        const paths = first
          ? [...first.querySelectorAll('a[href]')].map(a => { try { return new URL(a.href, location.origin).pathname; } catch { return '?'; } })
          : [];
        log(`Debug: no tags found. First comment's links: ${paths.slice(0, 6).join(', ') || 'none'}`);
      }

      return {
        version: 2,
        platform: 'facebook',
        postUrl: cleanPostUrl(),
        capturedAt: new Date().toISOString(),
        ownerUsernames: owners,
        entrants,
      };
    }

    function fileTag() {
      const match = location.href.match(/(pfbid[A-Za-z0-9]+|\d{8,})/);
      return match ? match[1].slice(0, 24) : 'post';
    }

    return { isPostView, capture, fileTag, profileKey, isExpander };
  })();

  // ========================================================================
  // Shared: one entry per account
  // ========================================================================

  /** Repeat comments are kept on the one entry for reference, never as extra entries. */
  function uniqueEntrants(rows, owners) {
    const byUsername = new Map();

    for (const row of rows) {
      if (owners.includes(row.username)) continue;
      const existing = byUsername.get(row.username);
      if (existing) {
        if (row.text) existing.comments.push(row.text);
        if (row.mentions) existing.mentions = [...new Set([...existing.mentions, ...row.mentions])];
        existing.fullName = existing.fullName || row.fullName;
        existing.profilePicUrl = existing.profilePicUrl || row.profilePicUrl;
        existing.profileUrl = existing.profileUrl || row.profileUrl;
        existing.userId = existing.userId || row.userId;
        continue;
      }
      const entry = {
        username: row.username,
        userId: row.userId,
        fullName: row.fullName,
        profilePicUrl: row.profilePicUrl,
        profileUrl: row.profileUrl,
        comments: row.text ? [row.text] : [],
      };
      // Facebook tags are profile links the site can't see in the text, so they travel with the entry.
      if (row.mentions) entry.mentions = [...row.mentions];
      byUsername.set(row.username, entry);
    }

    return [...byUsername.values()];
  }

  // ========================================================================
  // UI
  // ========================================================================
  const platform = IS_FACEBOOK ? FB : IG;

  const panel = document.createElement('div');
  panel.style.cssText = [
    'position:fixed', 'right:16px', 'bottom:16px', 'z-index:2147483647',
    'width:320px', 'padding:16px', 'border-radius:12px',
    'border:1px solid rgba(255,0,0,0.35)', 'background:rgba(14,13,13,0.97)',
    'box-shadow:0 10px 30px rgba(0,0,0,0.6)', 'color:#fff',
    'font-family:system-ui,-apple-system,sans-serif', 'font-size:13px', 'line-height:1.5',
  ].join(';');

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <strong style="letter-spacing:0.08em;text-transform:uppercase;font-size:11px;color:#FF3B3B">BHL Giveaway · ${IS_FACEBOOK ? 'Facebook' : 'Instagram'}</strong>
      <button id="bhl-hide" style="border:none;background:transparent;color:#888;cursor:pointer;font-size:16px;line-height:1">&times;</button>
    </div>
    <button id="bhl-run" style="width:100%;padding:10px;border:none;border-radius:8px;background:#FF0000;color:#fff;font-weight:700;cursor:pointer;letter-spacing:0.06em;text-transform:uppercase;font-size:12px">Capture entrants</button>
    <div id="bhl-log" style="margin-top:12px;max-height:160px;overflow-y:auto;font-size:11px;color:#bbb;white-space:pre-wrap"></div>
    <div id="bhl-actions" style="display:none;gap:8px;margin-top:12px">
      <button id="bhl-download" style="flex:1;padding:8px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:transparent;color:#fff;cursor:pointer;font-size:11px">Download</button>
      <button id="bhl-copy" style="flex:1;padding:8px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:transparent;color:#fff;cursor:pointer;font-size:11px">Copy</button>
    </div>
  `;
  document.body.appendChild(panel);

  const logBox = panel.querySelector('#bhl-log');
  function log(message) {
    logBox.textContent += (logBox.textContent ? '\n' : '') + message;
    logBox.scrollTop = logBox.scrollHeight;
  }
  function setStatus(message) {
    const lines = logBox.textContent.split('\n');
    lines[lines.length - 1] = message;
    logBox.textContent = lines.join('\n');
    logBox.scrollTop = logBox.scrollHeight;
  }

  // Both sites are single-page apps: opening a post changes the URL (or opens a dialog)
  // without a page load, so the script runs everywhere and only shows the panel on a post.
  let dismissed = false;
  let capturing = false;
  function syncVisibility() {
    if (capturing) return; // never hide mid-capture
    panel.style.display = !dismissed && platform.isPostView() ? 'block' : 'none';
  }
  syncVisibility();
  setInterval(syncVisibility, 800);

  panel.querySelector('#bhl-hide').onclick = () => {
    dismissed = true;
    panel.style.display = 'none';
  };

  let capture = null;

  panel.querySelector('#bhl-run').onclick = async () => {
    const button = panel.querySelector('#bhl-run');
    capturing = true;
    button.disabled = true;
    button.textContent = 'Capturing...';
    logBox.textContent = '';
    panel.querySelector('#bhl-actions').style.display = 'none';

    try {
      capture = await platform.capture();
      if (!capture.entrants.length) throw new Error('No entrants found on this post.');
      log('Done. Download it and import it on the giveaway in the admin dashboard.');
      panel.querySelector('#bhl-actions').style.display = 'flex';
    } catch (err) {
      capture = null;
      log(`Failed: ${err.message}`);
    } finally {
      capturing = false;
      button.disabled = false;
      button.textContent = 'Capture entrants';
    }
  };

  panel.querySelector('#bhl-download').onclick = () => {
    if (!capture) return;
    const blob = new Blob([JSON.stringify(capture, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bhl-giveaway-${capture.platform}-${platform.fileTag()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  panel.querySelector('#bhl-copy').onclick = async () => {
    if (!capture) return;
    const button = panel.querySelector('#bhl-copy');
    try {
      await navigator.clipboard.writeText(JSON.stringify(capture));
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy blocked';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 2000);
  };
})();
