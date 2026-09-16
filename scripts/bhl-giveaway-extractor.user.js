// ==UserScript==
// @name         BHL Giveaway Extractor
// @namespace    https://bhl-website.vercel.app/
// @version      2.0.0
// @description  Capture the unique commenters of a Brotherhood Legacy Instagram giveaway into the JSON the BHL admin dashboard imports.
// @author       Brotherhood Legacy
// @match        https://www.instagram.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * HOW TO USE
 *   1. Log into Instagram as the account that owns the giveaway post.
 *   2. Open the giveaway post. Both /p/<shortcode>/ and the /<username>/p/<shortcode>/
 *      links Instagram uses when you open a post from a profile work. The panel only
 *      appears while a post is open, including after in-app navigation.
 *   3. Click "Capture entrants" in the panel at the bottom-right.
 *   4. When it finishes, click Download (or Copy) and drop the file into
 *      BHL Admin -> Giveaways -> Entrants -> Import.
 *
 * WHAT IT CAPTURES
 *   Every top-level comment on the post, collapsed to one entry per account — commenting
 *   ten times still counts once. Threaded replies and the post owner's own comments are
 *   left out. Follows and likes are NOT captured: check that each winner follows the
 *   account from the admin dashboard before publishing, and redraw anyone who doesn't.
 *
 * NOTE ON FRAGILITY
 *   This uses Instagram's own internal web endpoints, not a documented API. They can
 *   change without notice. Requests are throttled and back off on 429 — don't lower the
 *   delays, since hammering them can get the account temporarily action-blocked.
 */

(function () {
  'use strict';

  // --- Tuning -------------------------------------------------------------
  const PAGE_DELAY_MS = 1200;     // Between successive pages of comments.
  const BACKOFF_MS = 60_000;      // How long to wait after a 429 before retrying.
  const MAX_RETRIES = 3;

  // The web app id Instagram's own frontend sends. Read from the page when possible
  // so this keeps working if Instagram rotates it; the constant is only a fallback.
  const FALLBACK_APP_ID = '936619743392459';

  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  // --- Small helpers ------------------------------------------------------
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function cookie(name) {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

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

  // --- Capture steps ------------------------------------------------------

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

  /** One entry per account — every comment kept, so the site can check mentions across all of them. */
  function uniqueEntrants(rows, ownerUsername) {
    const owner = ownerUsername ? ownerUsername.toLowerCase() : null;
    const byUsername = new Map();

    for (const row of rows) {
      if (owner && row.username === owner) continue;
      const existing = byUsername.get(row.username);
      if (existing) {
        if (row.text) existing.comments.push(row.text);
        existing.fullName = existing.fullName || row.fullName;
        existing.profilePicUrl = existing.profilePicUrl || row.profilePicUrl;
        existing.userId = existing.userId || row.userId;
        continue;
      }
      byUsername.set(row.username, {
        username: row.username,
        userId: row.userId,
        fullName: row.fullName,
        profilePicUrl: row.profilePicUrl,
        comments: row.text ? [row.text] : [],
      });
    }

    return [...byUsername.values()];
  }

  // --- UI -----------------------------------------------------------------
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
      <strong style="letter-spacing:0.08em;text-transform:uppercase;font-size:11px;color:#FF3B3B">BHL Giveaway</strong>
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

  // Instagram is a single-page app: moving from a profile to a post changes the URL
  // without a page load, so the script runs on every Instagram page and only shows
  // the panel while a post is actually open.
  let dismissed = false;
  let capturing = false;
  let lastPath = null;
  function syncVisibility() {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    // Never hide mid-capture — the run keeps using the shortcode it started with.
    if (capturing) return;
    panel.style.display = !dismissed && shortcodeFromUrl() ? 'block' : 'none';
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
      const shortcode = shortcodeFromUrl();
      if (!shortcode) throw new Error('Open the giveaway post first.');

      const mediaId = shortcodeToMediaId(shortcode);
      if (!mediaId) throw new Error(`Could not derive a media id from "${shortcode}".`);
      log(`Post ${shortcode} -> media ${mediaId}`);

      const ownerUsername = await fetchOwnerUsername(mediaId);
      if (ownerUsername) log(`Owner: @${ownerUsername} (their comments are left out)`);

      log('Fetching comments...');
      const rows = await fetchComments(mediaId, (count, page) =>
        setStatus(`Fetching comments... ${count} from ${page} page${page === 1 ? '' : 's'}`)
      );

      const entrants = uniqueEntrants(rows, ownerUsername);
      log(`${rows.length} comments -> ${entrants.length} unique accounts.`);

      if (entrants.length === 0) throw new Error('No entrants found on this post.');

      capture = {
        version: 2,
        postUrl: `https://www.instagram.com/p/${shortcode}/`,
        postId: mediaId,
        capturedAt: new Date().toISOString(),
        ownerUsername: ownerUsername || undefined,
        entrants,
      };

      log('Done. Download it and import it on the giveaway in the admin dashboard.');
      panel.querySelector('#bhl-actions').style.display = 'flex';
    } catch (err) {
      log(`Failed: ${err.message}`);
    } finally {
      capturing = false;
      lastPath = null; // re-evaluate visibility against wherever the user is now
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
    link.download = `bhl-giveaway-${capture.postUrl.split('/p/')[1].replace(/\//g, '')}.json`;
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
