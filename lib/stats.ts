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
      
      const DIVISIONS = ['gaming', 'music', 'sport', 'content'] as const;
      const [totalMembers, xpResult, divisionStatsRaw, completedChallenges, leaderResults] = await Promise.all([
        User.countDocuments(),
        User.aggregate<{ totalXP: number }>([{ $group: { _id: null, totalXP: { $sum: '$xp' } } }]),
        mongoose.connection.db!.collection('divisionstats').find({}).toArray(),
        mongoose.connection.db!.collection('submissions').countDocuments({ status: 'approved' }),
        Promise.all(
          DIVISIONS.map((divId) =>
            User.findOne(
              { divisions: divId, xp: { $gt: 0 } },
              { username: 1, avatar: 1, xp: 1 }
            )
              .sort({ xp: -1 })
              .lean<Pick<IUser, 'username' | 'avatar' | 'xp'> & { _id: unknown }>()
          )
        )
      ]);

      const divisionStats = divisionStatsRaw as unknown as DivisionStatDoc[];
      const totalXP = xpResult[0]?.totalXP || 0;
      const divisionCounts = { gaming: 0, music: 0, sport: 0, content: 0 };
      const divisionLeaders: Record<string, DivisionStatDoc['leader']> = {};

      divisionStats.forEach((stat) => {
        if (divisionCounts[stat.divisionId as keyof typeof divisionCounts] !== undefined) {
          divisionCounts[stat.divisionId as keyof typeof divisionCounts] = stat.memberCount || 0;
        }
      });

      DIVISIONS.forEach((divId, i) => {
        const u = leaderResults[i];
        if (u && u.xp > 0) {
          divisionLeaders[divId] = {
            userId: String(u._id),
            username: u.username,
            avatar: u.avatar,
            xp: u.xp,
          };
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

    divisionStats.forEach((stat) => {
      if (divisionCounts[stat.divisionId as keyof typeof divisionCounts] !== undefined) {
        divisionCounts[stat.divisionId as keyof typeof divisionCounts] = stat.memberCount || 0;
      }
    });

    const lastUpdated = divisionStats.length > 0
      ? Math.max(...divisionStats.map((s) => new Date(s.lastUpdated || Date.now()).getTime()))
      : Date.now();

    // Re-derive division leaders live from actual user data.
    // This bypasses the stale divisionstats.leader cache and always returns
    // the real current top-XP member for each division.
    const DIVISIONS = ['gaming', 'music', 'sport', 'content'] as const;
    const leaderResults = await Promise.all(
      DIVISIONS.map((divId) =>
        User.findOne(
          { divisions: divId, xp: { $gt: 0 } },
          { username: 1, avatar: 1, xp: 1 }
        )
          .sort({ xp: -1 })
          .lean<Pick<IUser, 'username' | 'avatar' | 'xp'> & { _id: unknown }>()
      )
    );

    const divisionLeaders: Record<string, DivisionStatDoc['leader']> = {};
    DIVISIONS.forEach((divId, i) => {
      const u = leaderResults[i];
      if (u && u.xp > 0) {
        divisionLeaders[divId] = {
          userId: String(u._id),
          username: u.username,
          avatar: u.avatar,
          xp: u.xp,
        };
      }
    });

    // Get the cached global stats for the heavy numbers (members, total xp)
    const globalStats = await getGlobalStats();

    return {
      ...globalStats,
      divisionCounts,
      divisionLeaders,
      lastUpdated,
    };
  } catch (error) {
    console.error('Failed to fetch live stats:', error);
    return getGlobalStats();
  }
};

