import mongoose from 'mongoose';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import '@/models/Challenge'; // Ensure models are registered

export const getGlobalStats = unstable_cache(
  async () => {
    try {
      await connectDB();
      
      const [totalMembers, xpResult, divisionStats, completedChallenges] = await Promise.all([
        User.countDocuments(),
        User.aggregate([{ $group: { _id: null, totalXP: { $sum: '$xp' } } }]),
        mongoose.connection.db!.collection('divisionstats').find({}).toArray(),
        mongoose.connection.db!.collection('submissions').countDocuments({ status: 'approved' })
      ]);

      const totalXP = xpResult[0]?.totalXP || 0;
      const divisionCounts = { gaming: 0, music: 0, sport: 0, content: 0 };
      const divisionLeaders: Record<string, any> = {};

      divisionStats.forEach((stat: any) => {
        if (divisionCounts[stat.divisionId as keyof typeof divisionCounts] !== undefined) {
          divisionCounts[stat.divisionId as keyof typeof divisionCounts] = stat.memberCount || 0;
        }
        if (stat.leader) {
          divisionLeaders[stat.divisionId] = stat.leader;
        }
      });

      return {
        totalMembers,
        totalXP,
        divisionCounts,
        completedChallenges,
        divisionLeaders
      };
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
      return {
        totalMembers: 0,
        totalXP: 0,
        divisionCounts: { gaming: 0, music: 0, sport: 0, content: 0 },
        completedChallenges: 0,
        divisionLeaders: {}
      };
    }
  },
  ['global-stats-low-freq'],
  { revalidate: 3600 } // Revalidate every hour
);




