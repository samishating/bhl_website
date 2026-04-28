import mongoose from 'mongoose';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import '@/models/Challenge'; // Ensure models are registered

export async function getGlobalStats() {
  console.time('getGlobalStats');
  await connectDB();
  
  const [totalMembers, xpResult, divisionResult, completedChallenges] = await Promise.all([
    User.countDocuments(),
    // Use a more targeted aggregation or just count if the collection is huge, 
    // but for now, we'll keep it but monitor performance
    User.aggregate([{ $group: { _id: null, totalXP: { $sum: '$xp' } } }]),
    User.aggregate([
      { $unwind: '$divisions' },
      { $group: { _id: '$divisions', count: { $sum: 1 } } }
    ]),
    mongoose.connection.db!.collection('submissions').countDocuments({ status: 'approved' })
  ]);
  console.timeEnd('getGlobalStats');

  const totalXP = xpResult[0]?.totalXP || 0;
  const divisionCounts = { gaming: 0, music: 0, sport: 0, content: 0 };
  divisionResult.forEach((d: any) => {
    if (divisionCounts[d._id as keyof typeof divisionCounts] !== undefined) {
      divisionCounts[d._id as keyof typeof divisionCounts] = d.count;
    }
  });

  const divisionLeaders: Record<string, any> = {};
  const divs = ['gaming', 'music', 'sport', 'content'];
  
  const leaderPromises = divs.map(div => 
    User.findOne({ divisions: div })
      .sort({ [`divisionXp.${div}`]: -1, xp: -1 })
      .select('username avatar xp divisionXp')
      .lean()
  );
  
  const leaders = await Promise.all(leaderPromises);
  leaders.forEach((leader, i) => {
    if (leader) {
      const div = divs[i];
      divisionLeaders[div] = {
        _id: (leader as any)._id,
        username: (leader as any).username,
        avatar: (leader as any).avatar,
        xp: (leader as any).divisionXp?.[div] || 0
      };
    }
  });

  const stats = {
    totalMembers,
    totalXP,
    divisionCounts,
    completedChallenges,
    divisionLeaders
  };

  return stats;
}
