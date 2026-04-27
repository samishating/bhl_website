import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Challenge } from '@/models/Challenge';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (payload?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    await Challenge.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Challenge deleted' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (payload?.role !== 'admin' && payload?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const challenge = await Challenge.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ challenge });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
