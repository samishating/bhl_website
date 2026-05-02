import { connectDB } from '@/lib/db';
import { SystemSettings } from '@/models/SystemSettings';
import { LEVEL_THRESHOLDS, LEVEL_TITLES } from '@/lib/xp';

/**
 * Fetches the current level progression architecture from the database.
 * Falls back to hardcoded defaults if no database settings are found.
 */
export async function getDynamicProgression() {
  try {
    await connectDB();
    const settings = await SystemSettings.findOne({ key: 'main' }).lean();
    
    if (!settings || !settings.levelProgression || settings.levelProgression.length === 0) {
      return {
        thresholds: LEVEL_THRESHOLDS,
        titles: LEVEL_TITLES
      };
    }

    const prog = settings.levelProgression as any[];
    return {
      thresholds: prog.map(p => p.xpRequired),
      titles: prog.map(p => p.title)
    };
  } catch (err) {
    console.error('[DYNAMIC_PROGRESSION_ERROR]', err);
    return {
      thresholds: LEVEL_THRESHOLDS,
      titles: LEVEL_TITLES
    };
  }
}
