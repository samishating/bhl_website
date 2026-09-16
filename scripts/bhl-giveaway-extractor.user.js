// ==UserScript==
// @name         BHL Giveaway Extractor
// @namespace    https://bhl-website.vercel.app/
// @version      1.1.0
// @description  Capture the entrants of a Brotherhood Legacy Instagram giveaway (comments, and optionally who liked and who follows) into the JSON the BHL admin dashboard imports.
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
 *   3. Click the "Capture entrants" panel in the bottom-right.
 *   4. When it finishes, click Download (or Copy) and drop the file into
 *      BHL Admin -> Giveaways -> Entrants -> Import.
 *
 * WHAT IT CAPTURES
 *   - Every top-level comment (paginated). Threaded REPLIES are not captured —
 *     entries are expected to be top-level comments.
 *   - Optionally the post's likers, to verify the "must have liked" rule.
 *   - Optionally your own follower list, to verify the "must follow" rule.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   - It does not dedupe, filter, or decide eligibility. It dumps what it sees and
 *     the server does all of that, so the roll stays reproducible and auditable.
 *   - If a check can't be completed (e.g. Instagram truncates the likers list), the
 *     field is emitted as `null` rather than `false`, and the site falls back to
 *     trust-based for that rule instead of wrongly excluding people.
 *
 * NOTE ON FRAGILITY
 *   These are Instagram's own internal web endpoints, not a documented API. They can
 *   change without notice. Requests are throttled and back off on 429 — do not lower
 *   the delays, since hammering them can get the account temporarily action-blocked.
 */

(function () {
  'use strict';

  // --- Tuning -------------------------------------------------------------
  const PAGE_DELAY_MS = 1200;     // Between successive pages of the same list.
  const BACKOFF_MS = 60_000;      // How long to wait after a 429 before retrying.
  const MAX_RETRIES = 3;
  const FOLLOWER_PAGE_SIZE = 200;

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

    return res.json();
  }

  // --- Capture steps ------------------------------------------------------

  /** Post owner + like count. The like count is what tells us if the likers list got truncated. */
  async function fetchMediaInfo(mediaId) {
    try {
      const data = await igFetch(`/api/v1/media/${mediaId}/info/`);
      const item = data && data.items && data.items[0];
      if (!item) return {};
      return {
        ownerUsername: item.user && item.user.username,
        likeCount: typeof item.like_count === 'number' ? item.like_count : null,
      };
    } catch (err) {
      log(`Could not read post info (${err.message}). Continuing without it.`);
      return {};
    }
  }

  async function fetchComments(mediaId, onProgress) {
    const rows = [];
    let minId = null;
    let page = 0;

    for (;;) {
      const query = minId
        ? `?can_support_threading=true&permalink_enabled=false&min_id=${encodeURIComponent(minId)}`
        : '?can_support_threading=true&permalink_enabled=false';
      const data = await igFetch(`/api/v1/media/${mediaId}/comments/${query}`);

      const batch = Array.isArray(data.comments) ? data.comments : [];
      for (const comment of batch) {
        const user = comment.user || {};
        // Deleted/restricted accounts come back without a username — skip rather than crash.
        if (!user.username) continue;
        rows.push({
          username: String(user.username).toLowerCase(),
          userId: user.pk != null ? String(user.pk) : undefined,
          fullName: user.full_name || undefined,
          profilePicUrl: user.profile_pic_url || undefined,
          comment: typeof comment.text === 'string' ? comment.text : '',
        });
      }

      page += 1;
      onProgress(rows.length, page);

      minId = data.next_min_id || null;
      if (!minId || batch.length === 0) break;
      await sleep(PAGE_DELAY_MS);
    }

    return rows;
  }

  async function fetchLikers(mediaId, likeCount) {
    const data = await igFetch(`/api/v1/media/${mediaId}/likers/`);
    const users = Array.isArray(data.users) ? data.users : [];
    const handles = new Set(users.map(u => String(u.username || '').toLowerCase()).filter(Boolean));

    // Instagram caps this list on high-engagement posts. If it looks truncated we must
    // NOT treat missing accounts as "didn't like" — report it as uncapturable instead.
    const truncated = typeof likeCount === 'number' && handles.size < likeCount;
    return { handles, truncated, seen: handles.size, likeCount };
  }

  async function fetchFollowers(onProgress) {
    const selfId = cookie('ds_user_id');
    if (!selfId) throw new Error('Could not read your user id from cookies — are you logged in?');

    const handles = new Set();
    let maxId = '';

    for (;;) {
      const query = `?count=${FOLLOWER_PAGE_SIZE}${maxId ? `&max_id=${encodeURIComponent(maxId)}` : ''}`;
      const data = await igFetch(`/api/v1/friendships/${selfId}/followers/${query}`);

      const users = Array.isArray(data.users) ? data.users : [];
      for (const user of users) {
        if (user.username) handles.add(String(user.username).toLowerCase());
      }
      onProgress(handles.size);

      maxId = data.next_max_id || '';
      if (!maxId || users.length === 0) break;
      await sleep(PAGE_DELAY_MS);
    }

    return handles;
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
    <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer">
      <input type="checkbox" id="bhl-likes" checked> Verify who liked
    </label>
    <label style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer">
      <input type="checkbox" id="bhl-follows"> Verify who follows (slow)
    </label>
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

      const { ownerUsername, likeCount } = await fetchMediaInfo(mediaId);
      if (ownerUsername) log(`Owner: @${ownerUsername}`);

      log('Fetching comments...');
      const rows = await fetchComments(mediaId, (count, page) =>
        setStatus(`Fetching comments... ${count} from ${page} page${page === 1 ? '' : 's'}`)
      );
      log(`${rows.length} raw comments captured.`);

      // --- optional: likes ---
      let likedHandles = null;
      if (panel.querySelector('#bhl-likes').checked) {
        log('Fetching likers...');
        try {
          const result = await fetchLikers(mediaId, likeCount);
          if (result.truncated) {
            log(
              `Instagram only returned ${result.seen} of ${result.likeCount} likers. ` +
              `Leaving "liked" unset so nobody is wrongly excluded.`
            );
          } else {
            likedHandles = result.handles;
            log(`${result.handles.size} likers captured.`);
          }
        } catch (err) {
          log(`Could not fetch likers (${err.message}). Leaving "liked" unset.`);
        }
      }

      // --- optional: follows ---
      let followerHandles = null;
      if (panel.querySelector('#bhl-follows').checked) {
        log('Fetching your followers...');
        try {
          followerHandles = await fetchFollowers(count => setStatus(`Fetching your followers... ${count}`));
          log(`${followerHandles.size} followers captured.`);
        } catch (err) {
          log(`Could not fetch followers (${err.message}). Leaving "follows" unset.`);
        }
      }

      // Stamp each row. `null` where we couldn't verify — never a guessed `false`.
      const entrants = rows.map(row => ({
        username: row.username,
        userId: row.userId,
        fullName: row.fullName,
        profilePicUrl: row.profilePicUrl,
        comments: [row.comment],
        liked: likedHandles ? likedHandles.has(row.username) : null,
        follows: followerHandles ? followerHandles.has(row.username) : null,
      }));

      capture = {
        version: 1,
        postUrl: `https://www.instagram.com/p/${shortcode}/`,
        postId: mediaId,
        capturedAt: new Date().toISOString(),
        ownerUsername: ownerUsername || undefined,
        entrants,
      };

      const unique = new Set(entrants.map(e => e.username)).size;
      log(`Done. ${entrants.length} comments from ${unique} unique accounts.`);
      log('The site does the dedup and rule checks on import.');
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
