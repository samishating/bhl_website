import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken({ userId: user._id.toString(), email: user.email, username: user.username, role: user.role });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user._id, username: user.username, email: user.email, xp: user.xp, level: user.level, divisions: user.divisions, badges: user.badges, role: user.role, avatar: user.avatar, bio: user.bio },
      token,
    });

    response.cookies.set('bhl_token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
