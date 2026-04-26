import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const division = searchParams.get('division');

    const query = division && division !== 'all' ? { divisions: division } : {};
    const users = await User.find(query)
      .select('username avatar xp level divisions badges')
      .sort({ xp: -1 })
      .limit(50);

    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
