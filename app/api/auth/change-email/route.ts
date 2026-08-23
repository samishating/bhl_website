import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest, signToken } from '@/lib/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newEmail } = await req.json();
    if (!currentPassword || !newEmail) {
      return NextResponse.json({ error: 'Current password and new email are required' }, { status: 400 });
    }

    const normalizedEmail = String(newEmail).trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Identity verification: require the current password before allowing the change
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    if (normalizedEmail === user.email) {
      return NextResponse.json({ error: 'That is already your current email' }, { status: 400 });
    }

    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (existing) {
      return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
    }

    user.email = normalizedEmail;
    await user.save();

    // Reissue the session token so it carries the updated email
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({ message: 'Email updated successfully', email: user.email });
    response.cookies.set('bhl_token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000) {
      return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
