export const XP_ACTIONS = {
  DAILY_LOGIN: 10,
  JOIN_DIVISION: 20,
  SUBMIT_CHALLENGE: 50,
} as const;

/**
 * Calculates a user's level from XP using DB-sourced thresholds.
 * thresholds: ascending array of XP values, one per level (index 0 = level 1).
 */
export function calculateLevel(xp: number, thresholds: number[]): number {
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

/**
 * Returns XP progress towards the next level using DB-sourced thresholds.
 */
export function xpForNextLevel(
  currentXp: number,
  thresholds: number[]
): { current: number; needed: number; progress: number } {
  const level = calculateLevel(currentXp, thresholds);
  const maxLevel = thresholds.length;

  if (level >= maxLevel) {
    const currentThreshold = thresholds[maxLevel - 1];
    return { current: currentXp - currentThreshold, needed: 0, progress: 100 };
  }

  const currentThreshold = thresholds[level - 1] || 0;
  const nextThreshold = thresholds[level];

  const xpInLevel = currentXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  return { current: xpInLevel, needed: xpNeeded, progress };
}

/**
 * Returns the level title from a DB-sourced titles array.
 * titles: array of strings, one per level (index 0 = level 1).
 */
export function getLevelTitle(level: number, titles: string[]): string {
  return titles[Math.min(level - 1, titles.length - 1)] || `Level ${level}`;
}

export const BADGES = {
  CHALLENGER: { id: 'CHALLENGER', label: 'Challenger', color: '#FF0000', description: 'First challenge submission' },
  RANKED: { id: 'RANKED', label: 'Ranked', color: '#CC0000', description: 'Reached Level 5' },
  GAMING_ELITE: { id: 'GAMING_ELITE', label: 'Gaming Elite', color: '#FFFDBA', description: 'Gaming division member' },
  MUSIC_ARTIST: { id: 'MUSIC_ARTIST', label: 'Music Artist', color: '#A855F7', description: 'Music division member' },
  SPORT_BEAST: { id: 'SPORT_BEAST', label: 'Sport Beast', color: '#06B6D4', description: 'Sport division member' },
  CONTENT_KING: { id: 'CONTENT_KING', label: 'Content King', color: '#EF4444', description: 'Content division member' },
} as const;

export type BadgeId = keyof typeof BADGES;

export function getDivisionBadge(division: string): BadgeId | null {
  const map: Record<string, BadgeId> = {
    gaming: 'GAMING_ELITE',
    music: 'MUSIC_ARTIST',
    sport: 'SPORT_BEAST',
    content: 'CONTENT_KING',
  };
  return map[division.toLowerCase()] || null;
}
