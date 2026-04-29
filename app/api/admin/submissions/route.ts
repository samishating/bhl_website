import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Submission } from '@/models/Submission';
import { User } from '@/models/User';
import { getUserFromRequest, verifyAdmin } from '@/lib/auth';
import '@/models/User';
import '@/models/Challenge';

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    
    // Fetch submissions and populate related data
    const submissions = await Submission.find({})
      .populate('userId', 'username avatar divisions')
      .populate('challengeId', 'title xpReward division')
      .populate('processedBy', 'username')
      .sort({ createdAt: -1 }); // Newest first for history
      
    return NextResponse.json({ submissions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
