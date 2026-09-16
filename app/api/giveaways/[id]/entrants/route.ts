import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Giveaway, type IGiveaway } from '@/models/Giveaway';
import { verifyAdmin, verifySuperAdmin } from '@/lib/auth';
import {
  dedupeEntrants,
  extractShortcode,
  isEligible,
  platformOf,
  PLATFORM_LABELS,
  type Platform,
} from '@/lib/giveaways';
import { revalidatePath } from 'next/cache';

/**
 * POST — import an Instagram or Facebook capture produced by the BHL giveaway extractor userscript
 * (scripts/bhl-giveaway-extractor.user.js), pasted or dropped into the admin dashboard.
 *
 * Everything the client sends is treated as raw data: the server does its own dedup,
 * keeps one entry per account, and drops the owner's own replies.
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
        { error: 'Winners have been drawn for this giveaway, so its entrants can no longer be replaced.' },
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

    const platform: Platform = payload?.platform === 'facebook' ? 'facebook' : 'instagram';

    // Guard against pasting the wrong Instagram post's capture into this giveaway.
    // (Facebook posts have no shortcode to compare against.)
    const capturedShortcode = platform === 'instagram' ? extractShortcode(payload?.postUrl) : null;
    if (capturedShortcode && capturedShortcode !== giveaway.shortcode) {
      return NextResponse.json(
        {
          error: `That capture is from post "${capturedShortcode}" but this giveaway is "${giveaway.shortcode}".`,
        },
        { status: 400 }
      );
    }

    const ownerUsername = typeof payload?.ownerUsername === 'string' ? payload.ownerUsername : undefined;
    const owners = [
      ownerUsername,
      ...(Array.isArray(payload?.ownerUsernames) ? payload.ownerUsernames : []),
      // Fall back to the Instagram owner from an earlier import, so tagging the giveaway
      // account never counts as a friend.
      platform === 'instagram' ? giveaway.ownerUsername : undefined,
    ].filter((o): o is string => typeof o === 'string');

    const entrants = dedupeEntrants(rows, { owners, platform });

    if (entrants.length === 0) {
      return NextResponse.json(
        { error: `No usable ${PLATFORM_LABELS[platform]} entrants after deduplication — check the capture format.` },
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

    // Instagram and Facebook share one draw: re-importing a platform replaces only that
    // platform's entrants and leaves the other one untouched.
    const otherPlatform = giveaway.entrants.filter(e => platformOf(e.username) !== platform);
    giveaway.entrants = [...otherPlatform, ...entrants];
    giveaway.entrantsCapturedAt = Number.isNaN(capturedAt.getTime()) ? new Date() : capturedAt;
    giveaway.entrantsSource = payload?.version ? 'userscript' : 'manual';
    if (platform === 'instagram' && ownerUsername) {
      giveaway.ownerUsername = ownerUsername.replace(/^@/, '').toLowerCase();
    }
    if (platform === 'facebook' && typeof payload?.postUrl === 'string' && /^https:\/\/([a-z0-9-]+\.)?facebook\.com\//i.test(payload.postUrl)) {
      giveaway.facebookPostUrl = payload.postUrl.slice(0, 500);
    }
    await giveaway.save();

    const eligibleCount = entrants.filter(e => isEligible(e, giveaway.minTags)).length;

    console.info(
      `[giveaways] ${platform} entrants imported for ${giveaway.shortcode} by ${admin.userId}: ` +
      `${rows.length} raw -> ${entrants.length} unique -> ${eligibleCount} eligible ` +
      `(${giveaway.entrants.length} total across platforms)`
    );

    revalidatePath('/admin/giveaways');

    return NextResponse.json({
      imported: {
        platform,
        raw: rows.length,
        unique: entrants.length,
        eligible: eligibleCount,
        total: giveaway.entrants.length,
      },
      giveaway,
    });
  } catch (err) {
    console.error('[giveaways] entrant import failed', err);
    return NextResponse.json({ error: 'Could not parse that capture — is it valid JSON?' }, { status: 400 });
  }
}

/**
 * PATCH — exclude or reinstate one entrant by hand before the roll.
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
        { error: 'Winners have been drawn for this giveaway. Use Redraw on a winner instead.' },
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
