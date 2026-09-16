import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Giveaway } from '@/models/Giveaway';
import { verifyAdmin } from '@/lib/auth';
import {
  GIVEAWAY_RULES,
  extractShortcode,
  canonicalPostUrl,
  shortcodeToMediaId,
  type GiveawayRule,
} from '@/lib/giveaways';
import { revalidatePath } from 'next/cache';

/**
 * A rolled giveaway is locked: its result can never change and its public
 * winners page stays up permanently, so edits and deletes are both refused.
 */
function lockedResponse() {
  return NextResponse.json(
    { error: 'This giveaway has been rolled and is locked. Its winners page stays published.' },
    { status: 409 }
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const giveaway = await Giveaway.findById(id);
    if (!giveaway) return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    if (giveaway.winners.length > 0) return lockedResponse();

    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (typeof body.title === 'string') {
      if (!body.title.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      update.title = body.title.trim();
    }

    if (typeof body.postUrl === 'string') {
      const shortcode = extractShortcode(body.postUrl);
      if (!shortcode) return NextResponse.json({ error: 'Not a valid Instagram post link' }, { status: 400 });
      if (shortcode !== giveaway.shortcode) {
        const clash = await Giveaway.findOne({ shortcode, _id: { $ne: id } }).select('_id').lean();
        if (clash) return NextResponse.json({ error: 'That Instagram post is already a giveaway' }, { status: 409 });
        // Swapping the post invalidates any entrants captured from the old one.
        update.entrants = [];
        update.entrantsCapturedAt = null;
        update.entrantsSource = null;
      }
      update.postUrl = canonicalPostUrl(shortcode);
      update.shortcode = shortcode;
      update.mediaId = shortcodeToMediaId(shortcode);
    }

    if (body.endDate !== undefined) {
      const end = new Date(body.endDate);
      if (Number.isNaN(end.getTime())) {
        return NextResponse.json({ error: 'A valid end date is required' }, { status: 400 });
      }
      update.endDate = end;
    }

    if (body.winnerCount !== undefined) {
      const count = Number(body.winnerCount);
      if (!Number.isInteger(count) || count < 1) {
        return NextResponse.json({ error: 'Winner count must be at least 1' }, { status: 400 });
      }
      update.winnerCount = count;
    }

    if (Array.isArray(body.rules)) {
      update.rules = [...new Set(body.rules)].filter(
        (r): r is GiveawayRule => GIVEAWAY_RULES.includes(r as GiveawayRule)
      );
    }

    if (body.minMentions !== undefined) {
      update.minMentions = Math.max(1, Number(body.minMentions) || 1);
    }

    const updated = await Giveaway.findByIdAndUpdate(id, update, { new: true });

    revalidatePath('/admin/giveaways');
    revalidatePath('/giveaways');

    return NextResponse.json({ giveaway: updated });
  } catch (err) {
    console.error('[giveaways] update failed', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const giveaway = await Giveaway.findById(id).select('winners shortcode').lean() as
      | { winners?: unknown[]; shortcode?: string }
      | null;
    if (!giveaway) return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    if (giveaway.winners && giveaway.winners.length > 0) return lockedResponse();

    await Giveaway.findByIdAndDelete(id);
    console.info(`[giveaways] removed ${giveaway.shortcode} by ${admin.userId}`);

    revalidatePath('/admin/giveaways');
    revalidatePath('/giveaways');

    return NextResponse.json({ message: 'Giveaway removed' });
  } catch (err) {
    console.error('[giveaways] delete failed', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
