import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { signToken } from '@/lib/auth';
import { XP_ACTIONS, calculateLevel, BADGES } from '@/lib/xp';


export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password, username } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return NextResponse.json({ error: 'Email or username already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const founderXp = XP_ACTIONS.DAILY_LOGIN;
    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      xp: founderXp,
      level: calculateLevel(founderXp),
      badges: [BADGES.FOUNDER.id],
      lastLogin: new Date(),
    });

    const token = signToken({ userId: user._id.toString(), email: user.email, username: user.username, role: user.role });

    const response = NextResponse.json({
      message: 'Account created successfully',
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        xp: user.xp, 
        level: user.level, 
        badges: user.badges, 
        role: user.role,
        avatar: user.avatar || '',
        bio: user.bio || '',
        divisions: user.divisions || [],
        divisionXp: user.divisionXp || { gaming: 0, music: 0, sport: 0, content: 0 }
      },
      token,
    }, { status: 201 });

    response.cookies.set('bhl_token', token, { 
      httpOnly: true, 
      maxAge: 60 * 60 * 24 * 7, 
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
