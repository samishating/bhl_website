import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Submission } from '@/models/Submission';
import { User } from '@/models/User';
import { Challenge } from '@/models/Challenge';
import { getUserFromRequest } from '@/lib/auth';
import { calculateLevel, BADGES } from '@/lib/xp';

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { challengeId, proofUrl } = await req.json();
    if (!challengeId || !proofUrl) {
      return NextResponse.json({ error: 'Challenge ID and proof URL required' }, { status: 400 });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });

    const existing = await Submission.findOne({ userId: payload.userId, challengeId });
    if (existing) {
      return NextResponse.json({ error: 'Already submitted for this challenge' }, { status: 409 });
    }

    const submission = await Submission.create({
      userId: payload.userId,
      challengeId,
      proofUrl,
      status: 'pending',
      xpAwarded: false,
    });

    return NextResponse.json({ submission, message: 'Submission pending approval' }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || payload.userId;

    if (userId !== payload.userId && !payload.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const submissions = await Submission.find({ userId })
      .populate('challengeId', 'title xpReward division')
      .sort({ createdAt: -1 });
    return NextResponse.json({ submissions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
