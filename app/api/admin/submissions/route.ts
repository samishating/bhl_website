import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Submission } from '@/models/Submission';
import { getUserFromRequest } from '@/lib/auth';
import '@/models/User';
import '@/models/Challenge';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (payload?.role !== 'admin' && payload?.role !== 'superadmin' && payload?.isAdmin !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
