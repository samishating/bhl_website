import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { calculateLevel, getDivisionBadge, XP_ACTIONS } from '@/lib/xp';
import { publishRealtimeUpdate } from '@/lib/realtime-updates';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await User.findById(id).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (payload.userId !== id && payload.role !== 'admin' && payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const { bio, avatar, divisions, username } = body;

    if (username !== undefined && username.trim() !== '' && username !== user.username) {
      if (payload.role !== 'superadmin') {
        return NextResponse.json({ error: 'Only superadmins can change usernames' }, { status: 403 });
      }
      // Check if username is already taken
      const existingUser = await User.findOne({ username, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    const oldDivisions = [...(user.divisions || [])];

    if (divisions !== undefined) {
      user.divisions = divisions;

      // Award XP and badges for new divisions
      const newDivisions = divisions.filter((d: string) => !oldDivisions.includes(d));
      for (const div of newDivisions) {
        user.xp += XP_ACTIONS.JOIN_DIVISION;
        const badge = getDivisionBadge(div);
        if (badge && !user.badges.includes(badge)) {
          user.badges.push(badge);
        }
      }

      // Deduct XP and remove badges for removed divisions
      const removedDivisions = oldDivisions.filter((d: string) => !divisions.includes(d));
      for (const div of removedDivisions) {
        user.xp = Math.max(0, user.xp - XP_ACTIONS.JOIN_DIVISION);
        const badge = getDivisionBadge(div);
        if (badge) {
          user.badges = user.badges.filter((b: string) => b !== badge);
        }
      }

      user.level = calculateLevel(user.xp);
    }

    await user.save();
    
    // Sync division stats for any affected divisions
    if (divisions !== undefined) {
      const { syncDivisionStats } = await import('@/lib/leader-sync');
      const affectedDivs = [...new Set([...(divisions || []), ...oldDivisions])];
      for (const divId of affectedDivs) {
        await syncDivisionStats(divId);
      }

      publishRealtimeUpdate({
        type: 'division-xp-update',
        reason: 'user-divisions-updated',
        userId: id,
        divisions: affectedDivs,
      });
    }

    const updated = await User.findById(id).select('-password');
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
