import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Giveaway, type IGiveaway } from '@/models/Giveaway';
import { verifySuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * POST — confirm the drawn winners and publish the result. Superadmin only.
 * From here the giveaway is locked: no redraws, edits or deletion, and the public
 * winners page goes live.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const giveaway = (await Giveaway.findById(id)) as IGiveaway | null;
    if (!giveaway) return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });

    if (giveaway.publishedAt) {
      return NextResponse.json({ error: 'These winners are already published.' }, { status: 409 });
    }
    if (giveaway.winners.length === 0) {
      return NextResponse.json({ error: 'Nothing to publish — roll the giveaway first.' }, { status: 400 });
    }

    giveaway.publishedAt = new Date();
    giveaway.publishedBy = admin.userId as never;
    await giveaway.save();

    console.info(
      `[giveaways] published ${giveaway.shortcode} by ${admin.userId}: ` +
      giveaway.winners.map(w => `@${w.username}`).join(', ')
    );

    revalidatePath('/admin/giveaways');
    revalidatePath('/giveaways');
    revalidatePath(`/giveaways/${giveaway.shortcode}`);

    return NextResponse.json({ giveaway });
  } catch (err) {
    console.error('[giveaways] publish failed', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
