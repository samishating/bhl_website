import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Referral } from '@/models/Referral';
import { verifySuperAdmin } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    await Referral.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Referral deleted' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const { isActive } = await req.json();
    const referral = await Referral.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!referral) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ referral });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
