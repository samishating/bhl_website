import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Submission } from '@/models/Submission';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import '@/models/User';
import '@/models/Challenge';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    let isAuthorized = payload?.role === 'admin' || payload?.role === 'superadmin';

    // Fallback for old tokens
    if (!isAuthorized && payload?.userId) {
      await connectDB();
      const user = await User.findById(payload.userId);
      if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    
    // Fetch pending submissions and populate related data
    const submissions = await Submission.find({ status: 'pending' })
      .populate('userId', 'username avatar divisions')
      .populate('challengeId', 'title xpReward division')
      .sort({ createdAt: 1 }); // Oldest first
      
    return NextResponse.json({ submissions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
