import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { unstable_cache } from 'next/cache';

const getCachedLeaderboard = unstable_cache(
  async (division: string | null) => {
    await connectDB();
    const query = division && division !== 'all' ? { divisions: division } : {};
    const sortField = division && division !== 'all' ? `divisionXp.${division}` : 'xp';
    
    return User.find(query)
      .select('username avatar xp level divisionXp divisions badges')
      .sort({ [sortField]: -1 })
      .limit(50)
      .lean();
  },
  ['leaderboard-data'],
  { tags: ['leaderboard', 'global-stats'], revalidate: 60 }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const division = searchParams.get('division');

    const users = await getCachedLeaderboard(division);

    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

