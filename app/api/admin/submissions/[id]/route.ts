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
    const { id } = await params;
    const { action } = await req.json(); // action can be 'approve', 'reject', or 'revoke'

    if (!action || !['approve', 'reject', 'revoke'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'revoke' && payload?.role !== 'superadmin') {
      const dbUser = await User.findById(payload?.userId);
      if (!dbUser || dbUser.role !== 'superadmin') {
        return NextResponse.json({ error: 'Only superadmins can revoke' }, { status: 403 });
      }
    }

    const submission = await Submission.findById(id).populate('challengeId');
    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    if (action !== 'revoke' && submission.status !== 'pending') {
      return NextResponse.json({ error: 'Submission is not pending' }, { status: 400 });
    }

    if (action === 'revoke' && submission.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved submissions can be revoked' }, { status: 400 });
    }

    if (action === 'reject' || (action === 'revoke' && submission.status === 'approved')) {
      const wasApproved = submission.status === 'approved';
      submission.status = 'rejected';
      submission.processedBy = payload!.userId as any;
      submission.processedAt = new Date();
      await submission.save();

      if (wasApproved) {
        const user = await User.findById(submission.userId);
        if (user && submission.challengeId) {
          const challengeReward = (submission.challengeId as any).xpReward || 50;
          const challengeDivision = (submission.challengeId as any).division;
          
          user.xp = Math.max(0, user.xp - challengeReward);
          if (challengeDivision && challengeDivision !== 'global' && user.divisionXp) {
            user.divisionXp[challengeDivision] = Math.max(0, (user.divisionXp[challengeDivision] || 0) - challengeReward);
            user.markModified('divisionXp');
          }
          user.level = calculateLevel(user.xp);
          await user.save();
        }
      }

      return NextResponse.json({ submission, message: wasApproved ? 'Submission revoked' : 'Submission rejected' });
    }

    if (action === 'approve') {
      submission.status = 'approved';
      submission.processedBy = payload!.userId as any;
      submission.processedAt = new Date();
      await submission.save();

      const user = await User.findById(submission.userId);
      if (user && submission.challengeId) {
        // Assume challengeId has been populated
        const challengeReward = (submission.challengeId as any).xpReward || 50;
        const challengeDivision = (submission.challengeId as any).division;
        
        user.xp += challengeReward;
        
        // Award division XP if applicable
        if (challengeDivision && challengeDivision !== 'global') {
          if (!user.divisionXp) {
            user.divisionXp = { gaming: 0, music: 0, sport: 0, content: 0 };
          }
          
          const currentDivXp = user.divisionXp[challengeDivision] || 0;
          user.divisionXp[challengeDivision] = currentDivXp + challengeReward;
          user.markModified('divisionXp');
        }
        
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
