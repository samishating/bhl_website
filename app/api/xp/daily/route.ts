import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { XP_ACTIONS, calculateLevel } from '@/lib/xp';

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const today = new Date();
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    const alreadyClaimed = lastLogin && 
      lastLogin.toDateString() === today.toDateString();

    if (alreadyClaimed) {
      return NextResponse.json({ message: 'Already claimed today', xp: user.xp, level: user.level });
    }

    user.xp += XP_ACTIONS.DAILY_LOGIN;
    user.level = calculateLevel(user.xp);
    user.lastLogin = today;
    await user.save();

    // Sync division stats if user belongs to any
    if (user.divisions && user.divisions.length > 0) {
      const { syncDivisionStats } = await import('@/lib/leader-sync');
      for (const divId of user.divisions) {
        await syncDivisionStats(divId);
      }
    }

    return NextResponse.json({ message: `+${XP_ACTIONS.DAILY_LOGIN} XP claimed!`, xp: user.xp, level: user.level, gained: XP_ACTIONS.DAILY_LOGIN });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
