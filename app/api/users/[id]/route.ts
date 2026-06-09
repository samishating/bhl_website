import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { calculateLevel, getDivisionBadge, XP_ACTIONS } from '@/lib/xp';
import { getDynamicProgression } from '@/lib/progression-server';
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
    
    // Live role check to avoid stale token bugs
    const { getCachedUserRole } = await import('@/lib/auth');
    const currentRole = await getCachedUserRole(payload.userId);

    if (payload.userId !== id && currentRole !== 'admin' && currentRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const { bio, avatar, divisions, username, socialLinks, isPublic, isFeatured, displayOrder, featuredLinks } = body;

    if (username !== undefined && username.trim() !== '' && username !== user.username) {
      if (currentRole !== 'superadmin') {
        return NextResponse.json({ error: 'Only superadmins can change usernames' }, { status: 403 });
      }
      // Check if username is already taken
      const existingUser = await User.findOne({ username, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
      user.username = username;
    }

    const oldYoutube = user.socialLinks?.youtube || '';
    const wasPublic = user.isPublic;

    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    
    let youtubeUrlChanged = false;
    if (socialLinks !== undefined) {
      const newYoutube = socialLinks.youtube || '';
      user.socialLinks = { ...user.socialLinks, ...socialLinks };
      
      if (newYoutube !== oldYoutube) {
        youtubeUrlChanged = true;
        // Clear cached channel/uploads playlist IDs and handle
        user.youtubeChannelId = '';
        user.youtubeUploadsPlaylistId = '';
        user.youtubeHandle = '';
        user.youtubeLastSynced = null;

        // Delete all cached videos for this creator to clear old cache
        const { CreatorVideo } = await import('@/models/CreatorVideo');
        await CreatorVideo.deleteMany({ userId: id });
      }
    }

    // Admin-only fields
    let isPublicEnabled = false;
    if (currentRole === 'admin' || currentRole === 'superadmin') {
      if (isPublic !== undefined) {
        user.isPublic = isPublic;
        if (isPublic === false) {
          // Delete cached videos immediately if creator visibility is disabled
          const { CreatorVideo } = await import('@/models/CreatorVideo');
          await CreatorVideo.deleteMany({ userId: id });
        } else if (isPublic === true && !wasPublic) {
          isPublicEnabled = true;
        }
      }
      if (isFeatured !== undefined) user.isFeatured = isFeatured;
      if (displayOrder !== undefined) user.displayOrder = displayOrder;
      if (featuredLinks !== undefined) user.featuredLinks = featuredLinks;
    }

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

      const { thresholds } = await getDynamicProgression();
      user.level = calculateLevel(user.xp, thresholds);
    }

    await user.save();

    // Trigger immediate YouTube sync if creator is public and either visibility was enabled or YouTube URL changed
    if (user.isPublic && (isPublicEnabled || youtubeUrlChanged)) {
      try {
        const { syncCreator } = await import('@/lib/server/youtube');
        await syncCreator(id);
      } catch (syncErr) {
        console.error('[YouTube Sync on Update]', syncErr);
      }
    }
    
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
