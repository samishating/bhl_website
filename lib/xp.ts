export const XP_ACTIONS = {
  DAILY_LOGIN: 10,
  JOIN_DIVISION: 20,
  SUBMIT_CHALLENGE: 50,
} as const;

export const LEVEL_THRESHOLDS = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  500,  // Level 4
  1000, // Level 5
  1750, // Level 6
  2750, // Level 7
  4000, // Level 8
  5500, // Level 9
  7500, // Level 10
];

export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function xpForNextLevel(currentXp: number): { current: number; needed: number; progress: number } {
  const level = calculateLevel(currentXp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  
  const xpInLevel = currentXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  return { current: xpInLevel, needed: xpNeeded, progress };
}

export const BADGES = {
  FOUNDER: { id: 'FOUNDER', label: 'Founder', color: '#FFD700', description: 'Joined at launch' },
  CHALLENGER: { id: 'CHALLENGER', label: 'Challenger', color: '#FF0000', description: 'First challenge submission' },
  RANKED: { id: 'RANKED', label: 'Ranked', color: '#CC0000', description: 'Reached Level 5' },
  GAMING_ELITE: { id: 'GAMING_ELITE', label: 'Gaming Elite', color: '#FF0000', description: 'Gaming division member' },
  MUSIC_ARTIST: { id: 'MUSIC_ARTIST', label: 'Music Artist', color: '#FFFDBA', description: 'Music division member' },
  SPORT_BEAST: { id: 'SPORT_BEAST', label: 'Sport Beast', color: '#22c55e', description: 'Sport division member' },
  CONTENT_KING: { id: 'CONTENT_KING', label: 'Content King', color: '#f59e0b', description: 'Content division member' },
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

export const LEVEL_TITLES = [
  'Recruit',    // 1
  'Initiate',   // 2
  'Member',     // 3
  'Veteran',    // 4
  'Elite',      // 5
  'Champion',   // 6
  'Legend',     // 7
  'Icon',       // 8
  'Mythic',     // 9
  'Brotherhood Master', // 10
];

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}
