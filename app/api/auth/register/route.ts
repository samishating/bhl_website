import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { signToken } from '@/lib/auth';
import { XP_ACTIONS, calculateLevel, BADGES } from '@/lib/xp';
import { getDynamicProgression } from '@/lib/progression-server';


function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

    // Normalize BEFORE checking -- the schema's lowercase/trim on email only applies when a
    // document is saved, not to query filters. A raw findOne({ email }) with e.g. "Test@x.com"
    // would miss an existing "test@x.com" record, letting the duplicate check pass right before
    // the insert collides with the unique index (or worse, succeeds if that index never built).
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();

    if (!normalizedEmail || !normalizedUsername) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const exists = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: { $regex: `^${escapeRegex(normalizedUsername)}$`, $options: 'i' } },
      ],
    });
    if (exists) {
      return NextResponse.json({ error: 'Email or username already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const founderXp = XP_ACTIONS.DAILY_LOGIN;
    const { thresholds } = await getDynamicProgression();
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      username: normalizedUsername,
      xp: founderXp,
      level: calculateLevel(founderXp, thresholds),
      badges: [],
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
  } catch (err: unknown) {
    // Safety net for the race window between the findOne check above and this insert
    // (two simultaneous requests for the same email/username could both pass the check).
    // The unique index is the real guarantee; this just turns its rejection into a clean
    // 409 instead of a generic 500.
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000) {
      return NextResponse.json({ error: 'Email or username already in use' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
