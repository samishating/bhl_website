import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const division = searchParams.get('division');

    const query = division && division !== 'all' ? { divisions: division } : {};
    const sortField = division && division !== 'all' ? `divisionXp.${division}` : 'xp';
    
    const users = await User.find(query)
      .select('username avatar xp level divisionXp divisions badges')
      .sort({ [sortField]: -1 })
      .limit(50);

    return NextResponse.json({ users }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


