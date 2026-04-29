import { connectDB } from './db';
import { User, IUser } from '@/models/User';
import { DivisionStat } from '@/models/DivisionStat';
import { revalidateTag } from 'next/cache';

export async function syncDivisionStats(divisionId: string) {
  try {
    await connectDB();

    // 1. Compute new leader
    const leader = await User.findOne({ divisions: divisionId })
      .sort({ [`divisionXp.${divisionId}`]: -1, xp: -1 })
      .select('username avatar divisionXp')
      .lean<IUser>();

    // 2. Compute member count
    const memberCount = await User.countDocuments({ divisions: divisionId });

    // 3. Update or Create DivisionStat
    await DivisionStat.findOneAndUpdate(
      { divisionId },
      {
        divisionId,
        leader: leader ? {
          userId: (leader as any)._id.toString(),
          username: leader.username,
          avatar: leader.avatar,
          xp: leader.divisionXp?.[divisionId as keyof typeof leader.divisionXp] || 0
        } : null,
        memberCount,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    revalidateTag('stats', 'stats');
  } catch (error) {
    console.error(`Failed to sync stats for division ${divisionId}:`, error);
  }
}

export async function syncAllDivisions() {
  const divisions = ['gaming', 'music', 'sport', 'content'];
  await Promise.all(divisions.map(d => syncDivisionStats(d)));
}
