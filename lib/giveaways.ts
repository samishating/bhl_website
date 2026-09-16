/**
 * lib/giveaways.ts
 * Isomorphic giveaway logic — safe to import from both server routes and client components.
 * Anything needing node:crypto (the roll itself) lives in the roll route and injects randomness here.
 */

/**
 * Rule types are an extensible enum (spec §8) — adding a new one never needs a schema rewrite.
 * These live here rather than in the Mongoose model so client components can import them
 * without pulling mongoose into the browser bundle.
 */
export const GIVEAWAY_RULES = ['follow', 'mention', 'like'] as const;
export type GiveawayRule = (typeof GIVEAWAY_RULES)[number];

/**
 * An entrant is an Instagram account, NOT a BHL user (spec §5).
 * Stored as plain embedded data, never linked to the `users` collection.
 */
export interface GiveawayEntrant {
  username: string;
  userId?: string;
  fullName?: string;
  profilePicUrl?: string;
  profileUrl: string;
  /** Raw comment text — the server derives `mentions` from this so the check is genuinely machine-verified. */
  comments: string[];
  mentions: string[];
  commentCount: number;
  /** true/false = verified by the extractor. null = not captured, so the rule falls back to trust-based. */
  liked: boolean | null;
  follows: boolean | null;
  /** Manual superadmin exclusion (spec §8 option 2). */
  disqualified: boolean;
  disqualifiedReason?: string;
}

export interface GiveawayWinner {
  username: string;
  profileUrl: string;
  fullName?: string;
  profilePicUrl?: string;
}

export type GiveawayStatus = 'active' | 'awaiting_roll' | 'rolled';

export const RULE_LABELS: Record<GiveawayRule, string> = {
  follow: 'Must follow',
  mention: 'Must mention a friend',
  like: 'Must have liked',
};

/** Which rules the extractor can actually prove, vs. which are self-reported (spec §8). */
export const RULE_VERIFIABILITY: Record<GiveawayRule, 'derived' | 'captured'> = {
  // Always machine-verified: derived server-side from the raw comment text.
  mention: 'derived',
  // Verified only when the extractor captured it; otherwise trust-based.
  like: 'captured',
  follow: 'captured',
};

// ---------------------------------------------------------------------------
// Post URL / shortcode / media id
// ---------------------------------------------------------------------------

/** Pulls the shortcode out of any /p/, /reel/ or /tv/ Instagram permalink. */
export function extractShortcode(input?: string | null): string | null {
  if (!input) return null;
  let value = input.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host !== 'instagram.com' && !host.endsWith('.instagram.com')) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  const kindIndex = parts.findIndex(p => p === 'p' || p === 'reel' || p === 'reels' || p === 'tv');
  if (kindIndex === -1) return null;

  const shortcode = parts[kindIndex + 1];
  if (!shortcode || !/^[A-Za-z0-9_-]{5,32}$/.test(shortcode)) return null;
  return shortcode;
}

export function canonicalPostUrl(shortcode: string): string {
  return `https://www.instagram.com/p/${shortcode}/`;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Instagram shortcodes are base64 of the numeric media pk, so the media id can be
 * derived offline — no API call and no token needed.
 */
export function shortcodeToMediaId(shortcode: string): string | null {
  // Media ids exceed Number.MAX_SAFE_INTEGER, so this has to be BigInt maths.
  // Constructor calls rather than `0n` literals — the project targets ES2017.
  const ZERO = BigInt(0);
  const RADIX = BigInt(64);

  let id = ZERO;
  for (const char of shortcode) {
    const index = B64.indexOf(char);
    if (index === -1) return null;
    id = id * RADIX + BigInt(index);
  }
  return id > ZERO ? id.toString() : null;
}

// ---------------------------------------------------------------------------
// Entrants
// ---------------------------------------------------------------------------

/** Instagram usernames: letters, digits, periods and underscores, up to 30 chars. */
const MENTION_RE = /@([A-Za-z0-9._]{1,30})/g;

export function extractMentions(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(MENTION_RE)) {
    // Trailing periods are punctuation, not part of the handle.
    const handle = match[1].replace(/\.+$/, '').toLowerCase();
    if (handle) found.add(handle);
  }
  return [...found];
}

export function profileUrl(username: string): string {
  return `https://www.instagram.com/${username}/`;
}

type RawEntrantRow = Partial<GiveawayEntrant> & {
  username?: string;
  comment?: string;
  message?: string;
};

/**
 * Collapses raw captured rows into one entrant per account (spec §5).
 * Accepts either pre-grouped rows (one per account, with a `comments` array) or
 * flat per-comment rows — repeat comments never buy extra entries either way.
 */
export function dedupeEntrants(
  rows: RawEntrantRow[],
  opts: { ownerUsername?: string } = {}
): GiveawayEntrant[] {
  const owner = opts.ownerUsername?.trim().toLowerCase().replace(/^@/, '');
  const byUsername = new Map<string, GiveawayEntrant>();

  for (const row of rows) {
    const username = String(row.username || '').trim().toLowerCase().replace(/^@/, '');
    // Skip junk and the giveaway account's own replies.
    if (!username || !/^[a-z0-9._]{1,30}$/.test(username)) continue;
    if (owner && username === owner) continue;

    const texts = [
      ...(Array.isArray(row.comments) ? row.comments : []),
      ...(typeof row.comment === 'string' ? [row.comment] : []),
      ...(typeof row.message === 'string' ? [row.message] : []),
    ].filter(t => typeof t === 'string' && t.length > 0);

    const existing = byUsername.get(username);
    if (existing) {
      existing.comments.push(...texts);
      existing.commentCount += Math.max(1, texts.length);
      // A capture of `true` anywhere wins; otherwise keep the most informative value.
      if (row.liked === true) existing.liked = true;
      else if (row.liked === false && existing.liked === null) existing.liked = false;
      if (row.follows === true) existing.follows = true;
      else if (row.follows === false && existing.follows === null) existing.follows = false;
      existing.fullName = existing.fullName || row.fullName || undefined;
      existing.profilePicUrl = existing.profilePicUrl || row.profilePicUrl || undefined;
      existing.userId = existing.userId || row.userId || undefined;
      continue;
    }

    byUsername.set(username, {
      username,
      userId: row.userId || undefined,
      fullName: row.fullName || undefined,
      profilePicUrl: row.profilePicUrl || undefined,
      profileUrl: profileUrl(username),
      comments: texts,
      mentions: [],
      commentCount: Math.max(1, texts.length),
      liked: row.liked === true ? true : row.liked === false ? false : null,
      follows: row.follows === true ? true : row.follows === false ? false : null,
      disqualified: false,
    });
  }

  // Derive mentions server-side from the raw text — never trust a client-computed list.
  for (const entrant of byUsername.values()) {
    const mentions = new Set<string>();
    for (const text of entrant.comments) {
      for (const handle of extractMentions(text)) {
        // Mentioning yourself isn't tagging a friend.
        if (handle !== entrant.username) mentions.add(handle);
      }
    }
    entrant.mentions = [...mentions];
  }

  return [...byUsername.values()];
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

export type RuleCheck = 'pass' | 'fail' | 'unverified';

export interface EligibilityResult {
  eligible: boolean;
  /** Per-rule outcome. 'unverified' = the extractor didn't capture it, so it passes on trust. */
  checks: Partial<Record<GiveawayRule, RuleCheck>>;
  reason?: string;
}

type EntrantFacts = Pick<GiveawayEntrant, 'mentions' | 'liked' | 'follows' | 'disqualified'>;

export function evaluateEntrant(
  entrant: EntrantFacts,
  giveaway: { rules: GiveawayRule[]; minMentions?: number }
): EligibilityResult {
  const checks: EligibilityResult['checks'] = {};
  const minMentions = Math.max(1, giveaway.minMentions || 1);

  if (entrant.disqualified) {
    return { eligible: false, checks, reason: 'Manually disqualified' };
  }

  let eligible = true;
  let reason: string | undefined;

  for (const rule of giveaway.rules || []) {
    if (rule === 'mention') {
      const passed = (entrant.mentions?.length || 0) >= minMentions;
      checks.mention = passed ? 'pass' : 'fail';
      if (!passed) {
        eligible = false;
        reason = reason || (minMentions > 1 ? `Fewer than ${minMentions} mentions` : 'No friend mentioned');
      }
      continue;
    }

    // follow / like: only a captured `false` disqualifies. `null` means the
    // extractor didn't capture it, so it falls back to trust-based (spec §8).
    const captured = rule === 'like' ? entrant.liked : entrant.follows;
    if (captured === false) {
      checks[rule] = 'fail';
      eligible = false;
      reason = reason || (rule === 'like' ? 'Did not like the post' : 'Not following');
    } else if (captured === true) {
      checks[rule] = 'pass';
    } else {
      checks[rule] = 'unverified';
    }
  }

  return { eligible, checks, reason };
}

export function eligibleEntrants<T extends EntrantFacts>(
  entrants: T[],
  giveaway: { rules: GiveawayRule[]; minMentions?: number }
): T[] {
  return entrants.filter(e => evaluateEntrant(e, giveaway).eligible);
}

// ---------------------------------------------------------------------------
// Status + the draw
// ---------------------------------------------------------------------------

export function giveawayStatus(giveaway: { endDate: Date | string; winners?: unknown[] }): GiveawayStatus {
  if (giveaway.winners && giveaway.winners.length > 0) return 'rolled';
  return new Date(giveaway.endDate).getTime() > Date.now() ? 'active' : 'awaiting_roll';
}

export const STATUS_LABELS: Record<GiveawayStatus, string> = {
  active: 'Accepting entries',
  awaiting_roll: 'Entries closed',
  rolled: 'Winners announced',
};

/**
 * Uniform Fisher-Yates, then take the first N (spec §10) — never a `Math.random()` sort.
 * `randomInt(max)` must return an unbiased integer in [0, max); the roll route supplies
 * a node:crypto implementation.
 */
export function pickWinners<T>(pool: T[], count: number, randomInt: (maxExclusive: number) => number): T[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/** Human-readable one-liner for the public feed, e.g. "Must follow · Must mention a friend · 3 winners". */
export function rulesSummary(giveaway: { rules: GiveawayRule[]; winnerCount: number }): string {
  const parts = (giveaway.rules || []).map(r => RULE_LABELS[r]).filter(Boolean);
  parts.push(`${giveaway.winnerCount} winner${giveaway.winnerCount === 1 ? '' : 's'}`);
  return parts.join(' · ');
}
