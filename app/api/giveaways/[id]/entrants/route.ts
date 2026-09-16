import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Giveaway, type IGiveaway } from '@/models/Giveaway';
import { verifyAdmin, verifySuperAdmin } from '@/lib/auth';
import { dedupeEntrants, extractShortcode, evaluateEntrant } from '@/lib/giveaways';
import { revalidatePath } from 'next/cache';

/**
 * POST — import an entrant capture produced by the BHL giveaway extractor userscript
 * (scripts/bhl-giveaway-extractor.user.js), pasted or dropped into the admin dashboard.
 *
 * Everything the client sends is treated as raw data: the server does its own dedup,
 * derives mentions from the raw comment text itself, and drops the owner's own replies.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const giveaway = (await Giveaway.findById(id)) as IGiveaway | null;
    if (!giveaway) return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    if (giveaway.winners.length > 0) {
      return NextResponse.json(
        { error: 'This giveaway has been rolled and is locked — its entrant snapshot cannot be replaced.' },
        { status: 409 }
      );
    }

    const body = await req.json();

    // Accept the documented capture envelope, or a bare array as a lenient manual fallback.
    const payload = Array.isArray(body) ? { entrants: body } : body;
    const rows = Array.isArray(payload?.entrants)
      ? payload.entrants
      : Array.isArray(payload?.comments)
        ? payload.comments
        : null;

    if (!rows) {
      return NextResponse.json(
        { error: 'Could not find an "entrants" array in that JSON.' },
        { status: 400 }
      );
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: 'That capture contains no entrants.' }, { status: 400 });
    }

    // Guard against pasting the wrong post's capture into this giveaway.
    const capturedShortcode = extractShortcode(payload?.postUrl);
    if (capturedShortcode && capturedShortcode !== giveaway.shortcode) {
      return NextResponse.json(
        {
          error: `That capture is from post "${capturedShortcode}" but this giveaway is "${giveaway.shortcode}".`,
        },
        { status: 400 }
      );
    }

    const ownerUsername = typeof payload?.ownerUsername === 'string' ? payload.ownerUsername : undefined;
    const entrants = dedupeEntrants(rows, { ownerUsername });

    if (entrants.length === 0) {
      return NextResponse.json(
        { error: 'No usable entrants after deduplication — check the capture format.' },
        { status: 400 }
      );
    }

    // Carry over any manual disqualifications already made against the same accounts.
    const priorDisqualified = new Map(
      giveaway.entrants.filter(e => e.disqualified).map(e => [e.username, e.disqualifiedReason])
    );
    for (const entrant of entrants) {
      if (priorDisqualified.has(entrant.username)) {
        entrant.disqualified = true;
        entrant.disqualifiedReason = priorDisqualified.get(entrant.username);
      }
    }

    const capturedAt = payload?.capturedAt ? new Date(payload.capturedAt) : new Date();

    giveaway.entrants = entrants;
    giveaway.entrantsCapturedAt = Number.isNaN(capturedAt.getTime()) ? new Date() : capturedAt;
    giveaway.entrantsSource = payload?.version ? 'userscript' : 'manual';
    if (ownerUsername) giveaway.ownerUsername = ownerUsername.replace(/^@/, '').toLowerCase();
    await giveaway.save();

    const eligibleCount = entrants.filter(e => evaluateEntrant(e, giveaway).eligible).length;

    console.info(
      `[giveaways] entrants imported for ${giveaway.shortcode} by ${admin.userId}: ` +
      `${rows.length} raw -> ${entrants.length} unique -> ${eligibleCount} eligible`
    );

    revalidatePath('/admin/giveaways');

    return NextResponse.json({
      imported: { raw: rows.length, unique: entrants.length, eligible: eligibleCount },
      giveaway,
    });
  } catch (err) {
    console.error('[giveaways] entrant import failed', err);
    return NextResponse.json({ error: 'Could not parse that capture — is it valid JSON?' }, { status: 400 });
  }
}

/**
 * PATCH — manually disqualify or reinstate one entrant (spec §8, the trust-but-verify escape hatch).
 * Superadmin only, since it directly changes who can win.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const { username, disqualified, reason } = await req.json();

    if (typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'An entrant username is required' }, { status: 400 });
    }

    const giveaway = (await Giveaway.findById(id)) as IGiveaway | null;
    if (!giveaway) return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    if (giveaway.winners.length > 0) {
      return NextResponse.json(
        { error: 'This giveaway has been rolled and is locked.' },
        { status: 409 }
      );
    }

    const handle = username.trim().toLowerCase().replace(/^@/, '');
    const entrant = giveaway.entrants.find(e => e.username === handle);
    if (!entrant) return NextResponse.json({ error: 'That entrant is not in this snapshot' }, { status: 404 });

    entrant.disqualified = !!disqualified;
    entrant.disqualifiedReason = disqualified && typeof reason === 'string' ? reason.trim() : undefined;
    await giveaway.save();

    console.info(
      `[giveaways] ${handle} ${entrant.disqualified ? 'disqualified' : 'reinstated'} ` +
      `on ${giveaway.shortcode} by ${admin.userId}`
    );

    revalidatePath('/admin/giveaways');

    return NextResponse.json({ giveaway });
  } catch (err) {
    console.error('[giveaways] disqualify failed', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
