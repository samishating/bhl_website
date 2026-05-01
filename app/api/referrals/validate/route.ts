import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Referral } from '@/models/Referral';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    await connectDB();
    const referral = await Referral.findOne({ 
      code: code.toUpperCase().trim(), 
      isActive: true 
    }).populate('assignedTo', 'username');

    if (!referral) {
      return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 404 });
    }

    return NextResponse.json({ 
      valid: true,
      code: referral.code,
      discountPercentage: referral.discountPercentage,
      assignedTo: (referral.assignedTo as any)?.username || 'BHL'
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
