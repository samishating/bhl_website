import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest, verifySuperAdmin } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifySuperAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Superadmin only.' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const { role } = await req.json();

    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent demoting/changing other superadmins or oneself
    if (targetUser.role === 'superadmin' || targetUser._id.toString() === admin.userId) {
      return NextResponse.json({ error: 'Cannot change role of a superadmin or yourself' }, { status: 403 });
    }

    targetUser.role = role;
    await targetUser.save();

    // Clear auth cache to apply changes immediately
    revalidateTag('auth', 'auth');

    return NextResponse.json({ message: `User role updated to ${role}`, user: targetUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
