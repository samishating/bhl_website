/**
 * lib/giveaways.ts
 * Isomorphic giveaway logic — safe to import from both server routes and client components.
 * Anything needing node:crypto (the draw itself) lives in the routes and injects randomness here.
 *
 * The only automatic entry condition is an optional minimum number of tagged friends, set per
 * giveaway (`minTags`, 0 = any comment). Everything else — follows, likes — is checked by hand
 * on the drawn winners, who are redrawn before publishing if they don't qualify.
 */

/** Upper bound for the "must tag N friends" setting — keeps typos like 50 from emptying the pool. */
export const MAX_REQUIRED_TAGS = 10;

/**
 * An entrant is an Instagram or Facebook account, NOT a BHL user (spec §5).
 * Stored as plain embedded data, never linked to the `users` collection.
 */
export interface GiveawayEntrant {
  username: string;
  userId?: string;
  fullName?: string;
  profilePicUrl?: string;
  profileUrl: string;
  /** Every comment this account left — kept for the audit trail. */
  comments: string[];
  commentCount: number;
  /** Distinct friends tagged across all their comments (never themselves or the giveaway account). */
  mentions: string[];
  /** Excluded by hand — before the roll, or when a drawn winner is redrawn. */
  disqualified: boolean;
  disqualifiedReason?: string;
}

export interface GiveawayWinner {
  username: string;
  profileUrl: string;
  fullName?: string;
  profilePicUrl?: string;
}

/** A drawn winner swapped out before publishing, kept for the audit trail. */
export interface GiveawayReplacedWinner {
  username: string;
  fullName?: string;
  profileUrl: string;
  reason: string;
  /** The username drawn in their place. */
  replacedBy: string;
  replacedAt: Date | string;
  replacedByUserId?: unknown;
}

/**
 * - active: entries open
 * - awaiting_roll: entries closed, nothing drawn yet
 * - drawn: winners drawn but not yet checked/published — admin-only, the public still sees awaiting_roll
 * - rolled: winners published, public and locked
 */
export type GiveawayStatus = 'active' | 'awaiting_roll' | 'drawn' | 'rolled';

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

/**
 * Instagram handles: letters, digits, periods, underscores, up to 30 chars. The `@` must not
 * follow a handle character, so email addresses like name@gmail.com aren't read as tags.
 */
const TAG_RE = /(?:^|[^A-Za-z0-9._@])@([A-Za-z0-9._]{1,30})/g;

export function extractMentions(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(TAG_RE)) {
    // A trailing period is sentence punctuation, not part of the handle.
    const handle = match[1].replace(/\.+$/, '').toLowerCase();
    if (handle) found.add(handle);
  }
  return [...found];
}

// ---------------------------------------------------------------------------
// Platforms
//
// Entrants from both platforms share one draw. `username` stays the unique key:
// Instagram handles as-is, Facebook accounts as `fb:<vanity>` or `fb:id:<number>`.
// Instagram handles can't contain ":", so the two can never collide.
// ---------------------------------------------------------------------------

export type Platform = 'instagram' | 'facebook';

const IG_HANDLE_RE = /^[a-z0-9._]{1,30}$/;
const FB_KEY_RE = /^fb:(id:\d{5,20}|[a-z0-9.]{1,80})$/;

export function platformOf(username: string): Platform {
  return username.startsWith('fb:') ? 'facebook' : 'instagram';
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
};

/** How an entrant or winner is shown: "@handle" on Instagram, their name on Facebook. */
export function entrantLabel(person: { username: string; fullName?: string }): string {
  if (platformOf(person.username) === 'facebook') return person.fullName || 'Facebook user';
  return `@${person.username}`;
}

/** Built from the key server-side, so an imported capture can never inject its own link. */
export function profileUrl(username: string): string {
  if (platformOf(username) === 'facebook') {
    const key = username.slice(3);
    return key.startsWith('id:')
      ? `https://www.facebook.com/profile.php?id=${key.slice(3)}`
      : `https://www.facebook.com/${key}`;
  }
  return `https://www.instagram.com/${username}/`;
}

function normalizeKey(value: unknown, platform: Platform): string | null {
  const key = String(value ?? '').trim().toLowerCase().replace(/^@/, '');
  const valid = platform === 'facebook' ? FB_KEY_RE.test(key) : IG_HANDLE_RE.test(key);
  return valid ? key : null;
}

type RawEntrantRow = Partial<GiveawayEntrant> & {
  username?: string;
  comment?: string;
  message?: string;
};

/**
 * Collapses raw captured rows from ONE platform into one entrant per account (spec §5).
 * Accepts either pre-grouped rows (one per account, with a `comments` array) or
 * flat per-comment rows — repeat comments never buy extra entries either way.
 *
 * `owners` are the giveaway account's own keys on that platform: their replies are
 * dropped, and tagging them never counts as tagging a friend.
 */
export function dedupeEntrants(
  rows: RawEntrantRow[],
  opts: { owners?: string[]; platform?: Platform } = {}
): GiveawayEntrant[] {
  const platform = opts.platform ?? 'instagram';
  const owners = new Set(
    (opts.owners ?? []).map(o => normalizeKey(o, platform)).filter((o): o is string => !!o)
  );
  const byUsername = new Map<string, GiveawayEntrant>();
  // Facebook tags are profile links, not "@handle" text, so the capture lists them per row.
  const capturedTags = new Map<string, Set<string>>();

  for (const row of rows) {
    const username = normalizeKey(row.username, platform);
    // Skip junk, rows from the other platform, and the giveaway account's own replies.
    if (!username || owners.has(username)) continue;

    if (platform === 'facebook' && Array.isArray(row.mentions)) {
      const tags = capturedTags.get(username) ?? new Set<string>();
      for (const tag of row.mentions) {
        const key = normalizeKey(tag, 'facebook');
        if (key) tags.add(key);
      }
      capturedTags.set(username, tags);
    }

    const texts = [
      ...(Array.isArray(row.comments) ? row.comments : []),
      ...(typeof row.comment === 'string' ? [row.comment] : []),
      ...(typeof row.message === 'string' ? [row.message] : []),
    ].filter(t => typeof t === 'string' && t.length > 0);

    const existing = byUsername.get(username);
    if (existing) {
      existing.comments.push(...texts);
      existing.commentCount += Math.max(1, texts.length);
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
      commentCount: Math.max(1, texts.length),
      mentions: [],
      disqualified: false,
    });
  }

  for (const entrant of byUsername.values()) {
    // Instagram tags are derived here from the raw comment text. Facebook tags can only
    // come from the capture's profile links, but are still validated key by key above.
    const candidates = platform === 'facebook'
      ? [...(capturedTags.get(entrant.username) ?? [])]
      : entrant.comments.flatMap(extractMentions);

    const tagged = new Set<string>();
    for (const handle of candidates) {
      // Tagging yourself or the giveaway account isn't tagging a friend.
      if (handle !== entrant.username && !owners.has(handle)) tagged.add(handle);
    }
    entrant.mentions = [...tagged];
  }

  return [...byUsername.values()];
}

type EligibilityFacts = Pick<GiveawayEntrant, 'disqualified'> & { mentions?: string[] };

/** Why an entrant can't win, or null if they can. */
export function ineligibleReason(entrant: EligibilityFacts, minTags = 0): string | null {
  if (entrant.disqualified) return 'Excluded';
  const tags = entrant.mentions?.length ?? 0;
  if (tags < minTags) {
    return tags === 0 ? 'No friends tagged' : `Tagged ${tags} of ${minTags}`;
  }
  return null;
}

/** Eligible = not excluded by hand, and tagged at least the giveaway's required number of friends. */
export function isEligible(entrant: EligibilityFacts, minTags = 0): boolean {
  return ineligibleReason(entrant, minTags) === null;
}

export function eligiblePool<T extends EligibilityFacts>(entrants: T[], minTags = 0): T[] {
  return entrants.filter(e => isEligible(e, minTags));
}

/** Validates the admin's "must tag N friends" input. Returns null when it's out of range. */
export function parseMinTags(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return 0;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > MAX_REQUIRED_TAGS) return null;
  return n;
}

/** Public one-liner for the entry condition, e.g. "Tag 2 friends · 3 winners". */
export function entrySummary(minTags: number | undefined, winnerCount: number): string {
  const tags = minTags ?? 0;
  const condition = tags === 0 ? 'Comment to enter' : `Tag ${tags} friend${tags === 1 ? '' : 's'}`;
  return `${condition} · ${winnersSummary(winnerCount)}`;
}

// ---------------------------------------------------------------------------
// Status + the draw
// ---------------------------------------------------------------------------

export function giveawayStatus(giveaway: {
  endDate: Date | string;
  winners?: unknown[];
  publishedAt?: Date | string | null;
}): GiveawayStatus {
  if (giveaway.publishedAt) return 'rolled';
  if (giveaway.winners && giveaway.winners.length > 0) return 'drawn';
  return new Date(giveaway.endDate).getTime() > Date.now() ? 'active' : 'awaiting_roll';
}

export const STATUS_LABELS: Record<GiveawayStatus, string> = {
  active: 'Accepting entries',
  awaiting_roll: 'Entries closed',
  drawn: 'Checking winners',
  rolled: 'Winners announced',
};

/**
 * Strips unpublished winners before a giveaway leaves the server for a public consumer.
 * Until publishing, a drawn winner might still be redrawn, so they must never be exposed.
 */
export function toPublicGiveaway<T extends { winners?: unknown[]; publishedAt?: Date | string | null }>(giveaway: T): T {
  if (giveaway.publishedAt) return giveaway;
  return { ...giveaway, winners: [] };
}

/**
 * Uniform Fisher-Yates, then take the first N (spec §10) — never a `Math.random()` sort.
 * `randomInt(max)` must return an unbiased integer in [0, max); the routes supply a
 * node:crypto implementation.
 */
export function pickWinners<T>(pool: T[], count: number, randomInt: (maxExclusive: number) => number): T[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Picks one replacement for a winner who failed the manual check.
 * Draws uniformly from the eligible pool, excluding everyone already drawn.
 */
export function pickReplacement<T extends { username: string }>(
  pool: T[],
  alreadyDrawn: string[],
  randomInt: (maxExclusive: number) => number
): T | null {
  const taken = new Set(alreadyDrawn);
  const remaining = pool.filter(e => !taken.has(e.username));
  if (remaining.length === 0) return null;
  return remaining[randomInt(remaining.length)];
}

/** e.g. "3 winners" — the only configuration a giveaway has besides its dates. */
export function winnersSummary(winnerCount: number): string {
  return `${winnerCount} winner${winnerCount === 1 ? '' : 's'}`;
}
