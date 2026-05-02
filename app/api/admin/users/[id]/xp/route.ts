import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { verifyAdmin } from '@/lib/auth';
import { calculateLevel } from '@/lib/xp';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const { xp } = await req.json();

    if (typeof xp !== 'number' || xp < 0) {
      return NextResponse.json({ error: 'Invalid XP value' }, { status: 400 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch dynamic progression
    const { getDynamicProgression } = await import('@/lib/progression-server');
    const { thresholds } = await getDynamicProgression();

    targetUser.xp = xp;
    targetUser.level = calculateLevel(xp, thresholds);
    await targetUser.save();

    return NextResponse.json({ 
      message: 'XP updated successfully', 
      xp: targetUser.xp, 
      level: targetUser.level 
    });
  } catch (err) {
    console.error('[XP_API_ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
