import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { connectDB } from '@/lib/db';
import { Giveaway, type IGiveaway } from '@/models/Giveaway';
import { verifySuperAdmin } from '@/lib/auth';
import { eligiblePool, pickReplacement } from '@/lib/giveaways';
import { revalidatePath } from 'next/cache';

/**
 * POST — replace one drawn winner who failed the manual check (didn't follow, didn't tag friends, etc.).
 * Superadmin only, and only before the result is published.
 *
 * The replaced account is disqualified so it can never be drawn again, and the swap is
 * recorded in `replacedWinners` so the result stays auditable.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const handle = typeof body.username === 'string' ? body.username.trim().toLowerCase().replace(/^@/, '') : '';
    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : "Didn't meet the conditions";

    if (!handle) return NextResponse.json({ error: 'Which winner should be replaced?' }, { status: 400 });

    const giveaway = (await Giveaway.findById(id)) as IGiveaway | null;
    if (!giveaway) return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });

    if (giveaway.publishedAt) {
      return NextResponse.json(
        { error: 'These winners are already published. The result is locked.' },
        { status: 409 }
      );
    }

    const slot = giveaway.winners.findIndex(w => w.username === handle);
    if (slot === -1) {
      return NextResponse.json({ error: `@${handle} is not one of the drawn winners.` }, { status: 400 });
    }

    // Exclude the failed winner for good, then redraw from whoever is still eligible.
    const entrant = giveaway.entrants.find(e => e.username === handle);
    if (entrant) {
      entrant.disqualified = true;
      entrant.disqualifiedReason = reason;
    }

    const pool = eligiblePool(giveaway.entrants, giveaway.minTags);
    const replacement = pickReplacement(
      pool,
      giveaway.winners.map(w => w.username),
      max => randomInt(max)
    );

    if (!replacement) {
      return NextResponse.json(
        {
          error:
            `No eligible entrants left to replace @${handle}. ` +
            `Every remaining entrant has already been drawn or excluded.`,
        },
        { status: 400 }
      );
    }

    const replaced = giveaway.winners[slot];
    // Same slot, so winner order (and the ranks shown on the winners page) stays stable.
    giveaway.winners[slot] = {
      username: replacement.username,
      profileUrl: replacement.profileUrl,
      fullName: replacement.fullName,
      profilePicUrl: replacement.profilePicUrl,
    };
    giveaway.markModified('winners');
    giveaway.replacedWinners.push({
      username: replaced.username,
      profileUrl: replaced.profileUrl,
      reason,
      replacedBy: replacement.username,
      replacedAt: new Date(),
      replacedByUserId: admin.userId,
    });
    await giveaway.save();

    console.info(
      `[giveaways] redraw on ${giveaway.shortcode} by ${admin.userId}: ` +
      `@${replaced.username} (${reason}) -> @${replacement.username}`
    );

    revalidatePath('/admin/giveaways');

    return NextResponse.json({
      replaced: replaced.username,
      replacement: {
        username: replacement.username,
        profileUrl: replacement.profileUrl,
        fullName: replacement.fullName,
      },
      giveaway,
    });
  } catch (err) {
    console.error('[giveaways] redraw failed', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
