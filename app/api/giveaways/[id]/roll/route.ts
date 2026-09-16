import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { connectDB } from '@/lib/db';
import { Giveaway, type IGiveaway } from '@/models/Giveaway';
import { verifySuperAdmin } from '@/lib/auth';
import { eligiblePool, pickWinners } from '@/lib/giveaways';
import { revalidatePath } from 'next/cache';

/**
 * POST — run the draw. Superadmin only (spec §10), and only from the admin dashboard.
 *
 * The winner count is NOT supplied by the caller: it was fixed when the giveaway was
 * created, and is re-validated here against the eligible pool as it actually stands.
 * The draw is private until published: a superadmin checks each winner by hand (e.g. that they
 * follow the account), redraws anyone who fails via /redraw, then publishes via /publish.
 * A giveaway can only be rolled once; individual winners are replaced, never re-rolled.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const giveaway = (await Giveaway.findById(id)) as IGiveaway | null;
    if (!giveaway) return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });

    if (giveaway.winners.length > 0) {
      return NextResponse.json(
        { error: 'Winners have already been drawn for this giveaway. Replace individual winners instead of re-rolling.' },
        { status: 409 }
      );
    }

    if (new Date(giveaway.endDate).getTime() > Date.now()) {
      return NextResponse.json(
        { error: 'Entries are still open — this giveaway can only be rolled after its end date.' },
        { status: 400 }
      );
    }

    if (giveaway.entrants.length === 0) {
      return NextResponse.json(
        { error: 'No entrants have been imported yet. Import a capture before rolling.' },
        { status: 400 }
      );
    }

    // Recompute eligibility fresh at roll time rather than trusting anything stored.
    const pool = eligiblePool(giveaway.entrants);

    if (pool.length < giveaway.winnerCount) {
      return NextResponse.json(
        {
          error:
            `Only ${pool.length} eligible entrant${pool.length === 1 ? '' : 's'} but this giveaway is ` +
            `configured for ${giveaway.winnerCount} winner${giveaway.winnerCount === 1 ? '' : 's'}. ` +
            `Lower the winner count or reinstate excluded entrants before rolling.`,
          eligibleCount: pool.length,
          winnerCount: giveaway.winnerCount,
        },
        { status: 400 }
      );
    }

    const drawn = pickWinners(pool, giveaway.winnerCount, max => randomInt(max));

    giveaway.winners = drawn.map(e => ({
      username: e.username,
      profileUrl: e.profileUrl,
      fullName: e.fullName,
      profilePicUrl: e.profilePicUrl,
    }));
    giveaway.rolledAt = new Date();
    giveaway.rolledBy = admin.userId as never;
    await giveaway.save();

    console.info(
      `[giveaways] rolled ${giveaway.shortcode} by ${admin.userId}: ` +
      `${pool.length} eligible -> ${drawn.map(w => w.username).join(', ')}`
    );

    // Only the dashboard changes — the public feed and winners page wait for publishing.
    revalidatePath('/admin/giveaways');

    return NextResponse.json({
      winners: giveaway.winners,
      // Real eligible handles so the dashboard can cycle actual names during the reveal.
      pool: pool.map(e => e.username),
      eligibleCount: pool.length,
      giveaway,
    });
  } catch (err) {
    console.error('[giveaways] roll failed', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
