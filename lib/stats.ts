import mongoose from 'mongoose';
import { User, IUser } from '@/models/User';
import { connectDB } from '@/lib/db';
import '@/models/Challenge'; 
import { unstable_cache } from 'next/cache';

interface DivisionStatDoc {
  divisionId: string;
  memberCount: number;
  leader?: {
    userId: string;
    username: string;
    avatar?: string;
    xp: number;
  };
  lastUpdated: Date;
}

export const getGlobalStats = unstable_cache(
  async () => {
    try {
      await connectDB();
      
      const [totalMembers, xpResult, divisionStatsRaw, completedChallenges] = await Promise.all([
        User.countDocuments(),
        User.aggregate<{ totalXP: number }>([{ $group: { _id: null, totalXP: { $sum: '$xp' } } }]),
        mongoose.connection.db!.collection('divisionstats').find({}).toArray(),
        mongoose.connection.db!.collection('submissions').countDocuments({ status: 'approved' })
      ]);

      const divisionStats = divisionStatsRaw as unknown as DivisionStatDoc[];
      const totalXP = xpResult[0]?.totalXP || 0;
      const divisionCounts = { gaming: 0, music: 0, sport: 0, content: 0 };
      const divisionLeaders: Record<string, DivisionStatDoc['leader']> = {};

      divisionStats.forEach((stat) => {
        if (divisionCounts[stat.divisionId as keyof typeof divisionCounts] !== undefined) {
          divisionCounts[stat.divisionId as keyof typeof divisionCounts] = stat.memberCount || 0;
        }
        if (stat.leader) {
          divisionLeaders[stat.divisionId] = stat.leader;
        }
      });

      const lastUpdated = divisionStats.length > 0 
        ? Math.max(...divisionStats.map((s) => new Date(s.lastUpdated || Date.now()).getTime()))
        : Date.now();

      return {
        totalMembers,
        totalXP,
        divisionCounts,
        completedChallenges,
        divisionLeaders,
        lastUpdated
      };
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
      return {
        totalMembers: 0,
        totalXP: 0,
        divisionCounts: { gaming: 0, music: 0, sport: 0, content: 0 },
        completedChallenges: 0,
        divisionLeaders: {},
        lastUpdated: Date.now()
      };
    }
  },
  ['global-stats'],
  { revalidate: 3600, tags: ['stats'] }
);

export const getLiveStats = async () => {
  try {
    await connectDB();
    const divisionStatsRaw = await mongoose.connection.db!.collection('divisionstats').find({}).toArray();
    const divisionStats = divisionStatsRaw as unknown as DivisionStatDoc[];
    
    const divisionCounts = { gaming: 0, music: 0, sport: 0, content: 0 };
    const divisionLeaders: Record<string, DivisionStatDoc['leader']> = {};

    divisionStats.forEach((stat) => {
      if (divisionCounts[stat.divisionId as keyof typeof divisionCounts] !== undefined) {
        divisionCounts[stat.divisionId as keyof typeof divisionCounts] = stat.memberCount || 0;
      }
      if (stat.leader) {
        divisionLeaders[stat.divisionId] = stat.leader;
      }
    });

    const lastUpdated = divisionStats.length > 0 
      ? Math.max(...divisionStats.map((s) => new Date(s.lastUpdated || Date.now()).getTime()))
      : Date.now();

    // Get the cached global stats for the heavy numbers (members, xp)
    const globalStats = await getGlobalStats();

    return {
      ...globalStats,
      divisionCounts,
      divisionLeaders,
      lastUpdated
    };
  } catch (error) {
    console.error('Failed to fetch live stats:', error);
    return getGlobalStats();
  }
};

