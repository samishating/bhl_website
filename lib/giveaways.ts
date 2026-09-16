/**
 * lib/giveaways.ts
 * Isomorphic giveaway logic — safe to import from both server routes and client components.
 * Anything needing node:crypto (the draw itself) lives in the routes and injects randomness here.
 *
 * Giveaways have no automatic entry conditions. Every unique commenter is eligible; the
 * superadmin checks the drawn winners by hand (follows, tagged friends, whatever the post
 * asked for) and redraws anyone who doesn't qualify before publishing.
 */

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
  /** Every comment this account left — kept for the audit trail. */
  comments: string[];
  commentCount: number;
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
      disqualified: false,
    });
  }

  return [...byUsername.values()];
}

/** No automatic conditions: every unique commenter is eligible unless excluded by hand. */
export function isEligible(entrant: Pick<GiveawayEntrant, 'disqualified'>): boolean {
  return !entrant.disqualified;
}

export function eligiblePool<T extends Pick<GiveawayEntrant, 'disqualified'>>(entrants: T[]): T[] {
  return entrants.filter(isEligible);
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
