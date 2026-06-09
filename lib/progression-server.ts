import { connectDB } from '@/lib/db';
import { SystemSettings } from '@/models/SystemSettings';

/**
 * Fetches the current level progression from the database.
 * Throws if no configuration exists — all callers must have DB progression set up.
 */
export async function getDynamicProgression(): Promise<{
  thresholds: number[];
  titles: string[];
}> {
  await connectDB();
  const settings = await SystemSettings.findOne({ key: 'main' }).lean();

  if (!settings || !settings.levelProgression || settings.levelProgression.length === 0) {
    throw new Error('No level progression configured in the database. Set up progression via the admin XP panel.');
  }

  const prog = settings.levelProgression as { xpRequired: number; title: string }[];
  return {
    thresholds: prog.map(p => p.xpRequired),
    titles: prog.map(p => p.title),
  };
}
