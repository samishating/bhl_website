export const XP_ACTIONS = {
  DAILY_LOGIN: 10,
  JOIN_DIVISION: 20,
  SUBMIT_CHALLENGE: 50,
} as const;

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  1750,   // Level 6
  2750,   // Level 7
  10000,  // Level 11
  12500,  // Level 12
  15000,  // Level 13
  17500,  // Level 14
  20000,  // Level 15
  22500,  // Level 16
  25000,  // Level 17
  27500,  // Level 18
  30000,  // Level 19
  32500,  // Level 20
  35000,  // Level 21
  37500,  // Level 22
  40000,  // Level 23
  42000,  // Level 24
  44000,  // Level 25
  46000,  // Level 26
  47500,  // Level 27
  48500,  // Level 28
  49500,  // Level 29
  50000,  // Level 30
];

export const LEVEL_TITLES = [
  'Recruit', 'Novice', 'Apprentice', 'Initiate', 'Member',
  'Trusted', 'Veteran', 'Elite', 'Specialist', 'Warrior',
  'Champion', 'Commander', 'Captain', 'Hero', 'Legend',
  'Icon', 'Mythic', 'Vanguard', 'Sentinel', 'Guardian',
  'Overseer', 'Warlord', 'Conqueror', 'Sovereign', 'Immortal',
  'Celestial', 'Ascendant', 'Apex', 'Brotherhood Master', 'Eternal Legacy',
];

export function calculateLevel(xp: number, thresholds: number[] = LEVEL_THRESHOLDS): number {
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function xpForNextLevel(currentXp: number, thresholds: number[] = LEVEL_THRESHOLDS): { current: number; needed: number; progress: number } {
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

export function getLevelTitle(level: number, titles: string[] = LEVEL_TITLES): string {
  return titles[Math.min(level - 1, titles.length - 1)] || 'Recruit';
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
