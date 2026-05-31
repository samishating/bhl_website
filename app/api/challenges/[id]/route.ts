import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Challenge } from '@/models/Challenge';
import { verifyAdmin, verifySuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    await Challenge.findByIdAndDelete(id);

    // Revalidate admin page so deletion is reflected immediately
    revalidatePath('/admin/challenges');

    return NextResponse.json({ message: 'Challenge deleted' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const challenge = await Challenge.findByIdAndUpdate(id, body, { new: true });

    // Revalidate admin page
    revalidatePath('/admin/challenges');

    return NextResponse.json({ challenge });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
