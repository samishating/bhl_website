import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Referral } from '@/models/Referral';
import { verifySuperAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const referrals = await Referral.find().populate('assignedTo', 'username email role').sort({ createdAt: -1 });
    return NextResponse.json({ referrals });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { code, discountPercentage, assignedTo } = await req.json();

    if (!code || !discountPercentage || !assignedTo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await Referral.findOne({ code: code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });
    }

    const referral = await Referral.create({
      code: code.toUpperCase(),
      discountPercentage,
      assignedTo
    });

    return NextResponse.json({ referral }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
