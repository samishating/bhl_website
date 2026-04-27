import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Submission } from '@/models/Submission';
import { User } from '@/models/User';
import { Challenge } from '@/models/Challenge';
import { getUserFromRequest } from '@/lib/auth';
import { calculateLevel, BADGES } from '@/lib/xp';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    let isAuthorized = payload?.role === 'admin' || payload?.role === 'superadmin' || payload?.isAdmin === true;

    // Fallback for old tokens
    if (!isAuthorized && payload?.userId) {
      await connectDB();
      const user = await User.findById(payload.userId);
      if (user && (user.role === 'admin' || user.role === 'superadmin' || (user as any).isAdmin)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const { action } = await req.json(); // action can be 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const submission = await Submission.findById(id).populate('challengeId');
    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    if (submission.status !== 'pending') {
      return NextResponse.json({ error: 'Submission is not pending' }, { status: 400 });
    }

    if (action === 'reject') {
      submission.status = 'rejected';
      await submission.save();
      return NextResponse.json({ submission, message: 'Submission rejected' });
    }

    if (action === 'approve') {
      submission.status = 'approved';
      submission.xpAwarded = true;
      await submission.save();

      const user = await User.findById(submission.userId);
      if (user && submission.challengeId) {
        // Assume challengeId has been populated
        const challengeReward = (submission.challengeId as any).xpReward || 50;
        user.xp += challengeReward;
        user.level = calculateLevel(user.xp);
        
        if (!user.badges.includes(BADGES.CHALLENGER.id)) {
          user.badges.push(BADGES.CHALLENGER.id);
        }
        if (user.level >= 5 && !user.badges.includes(BADGES.RANKED.id)) {
          user.badges.push(BADGES.RANKED.id);
        }
        await user.save();
      }
      return NextResponse.json({ submission, message: 'Submission approved and XP awarded' });
    }

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
