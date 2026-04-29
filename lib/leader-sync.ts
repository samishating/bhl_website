import { connectDB } from './db';
import { User } from '@/models/User';
import { DivisionStat } from '@/models/DivisionStat';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function syncDivisionStats(divisionId: string) {
  try {
    await connectDB();

    // 1. Compute new leader
    const leader = await User.findOne({ divisions: divisionId })
      .sort({ [`divisionXp.${divisionId}`]: -1, xp: -1 })
      .select('username avatar divisionXp')
      .lean();

    // 2. Compute member count
    const memberCount = await User.countDocuments({ divisions: divisionId });

    // 3. Update or Create DivisionStat
    await DivisionStat.findOneAndUpdate(
      { divisionId },
      {
        divisionId,
        leader: leader ? {
          userId: (leader as any)._id,
          username: (leader as any).username,
          avatar: (leader as any).avatar,
          xp: (leader as any).divisionXp?.[divisionId] || 0
        } : null,
        memberCount,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`Synced stats for division: ${divisionId}`);
    revalidateTag('stats', 'stats');
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error(`Failed to sync stats for division ${divisionId}:`, error);
  }
}

export async function syncAllDivisions() {
  const divisions = ['gaming', 'music', 'sport', 'content'];
  await Promise.all(divisions.map(d => syncDivisionStats(d)));
}
