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
  4000,   // Level 8
  5500,   // Level 9
  7500,   // Level 10
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
  const maxLevel = LEVEL_THRESHOLDS.length;
  
  if (level >= maxLevel) {
    const currentThreshold = LEVEL_THRESHOLDS[maxLevel - 1];
    return { current: currentXp - currentThreshold, needed: 0, progress: 100 };
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level];
  
  const xpInLevel = currentXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = Math.min(Math.round((xpInLevel / xpNeeded) * 100), 100);

  return { current: xpInLevel, needed: xpNeeded, progress };
}


export const BADGES = {
  FOUNDER: { id: 'FOUNDER', label: 'Founder', color: '#FFFDBA', description: 'Joined at launch' },
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

export const LEVEL_TITLES = [
  'Recruit',    // 1
  'Novice',     // 2
  'Apprentice', // 3
  'Initiate',   // 4
  'Member',     // 5
  'Trusted',    // 6
  'Veteran',    // 7
  'Elite',      // 8
  'Specialist', // 9
  'Warrior',    // 10
  'Champion',   // 11
  'Commander',  // 12
  'Captain',    // 13
  'Hero',       // 14
  'Legend',     // 15
  'Icon',       // 16
  'Mythic',     // 17
  'Vanguard',   // 18
  'Sentinel',   // 19
  'Guardian',   // 20
  'Overseer',   // 21
  'Warlord',    // 22
  'Conqueror',  // 23
  'Sovereign',  // 24
  'Immortal',   // 25
  'Celestial',  // 26
  'Ascendant',  // 27
  'Apex',       // 28
  'Brotherhood Master', // 29
  'Eternal Legacy', // 30
];

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

