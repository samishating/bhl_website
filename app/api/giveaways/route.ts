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

/** Entrant data never leaves the server for public consumers (spec §5/§12). */
const PUBLIC_FIELDS = 'title postUrl shortcode endDate rules minMentions winnerCount winners rolledAt createdAt';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const admin = await verifyAdmin(req);

    // Admins get the full record (entrant snapshot included) for the dashboard.
    const query = Giveaway.find({}).sort({ endDate: -1 });
    if (!admin) query.select(PUBLIC_FIELDS);

    const giveaways = await query.lean();
    return NextResponse.json({ giveaways }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    console.error('[giveaways] list failed', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const body = await req.json();
    const { title, postUrl, endDate, rules, minMentions, winnerCount } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const shortcode = extractShortcode(postUrl);
    if (!shortcode) {
      return NextResponse.json({ error: 'Not a valid Instagram post link' }, { status: 400 });
    }

    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: 'A valid end date is required' }, { status: 400 });
    }

    const count = Number(winnerCount);
    if (!Number.isInteger(count) || count < 1) {
      return NextResponse.json({ error: 'Winner count must be at least 1' }, { status: 400 });
    }

    const cleanRules: GiveawayRule[] = Array.isArray(rules)
      ? [...new Set(rules)].filter((r): r is GiveawayRule => GIVEAWAY_RULES.includes(r as GiveawayRule))
      : [];

    const existing = await Giveaway.findOne({ shortcode }).select('_id').lean();
    if (existing) {
      return NextResponse.json({ error: 'That Instagram post is already a giveaway' }, { status: 409 });
    }

    const giveaway = await Giveaway.create({
      title: title.trim(),
      postUrl: canonicalPostUrl(shortcode),
      shortcode,
      mediaId: shortcodeToMediaId(shortcode),
      endDate: end,
      rules: cleanRules,
      minMentions: Math.max(1, Number(minMentions) || 1),
      winnerCount: count,
      createdBy: admin.userId,
    });

    console.info(`[giveaways] created ${shortcode} by ${admin.userId}`);

    revalidatePath('/admin/giveaways');
    revalidatePath('/giveaways');

    return NextResponse.json({ giveaway }, { status: 201 });
  } catch (err) {
    console.error('[giveaways] create failed', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
