import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Challenge } from '@/models/Challenge';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const division = searchParams.get('division');
    const query: Record<string, unknown> = { active: true };
    if (division && division !== 'global') query.division = division;
    
    const challenges = await Challenge.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ challenges });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (payload?.role !== 'admin' && payload?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { title, description, xpReward, division } = await req.json();
    if (!title || !description) return NextResponse.json({ error: 'Title and description required' }, { status: 400 });

    const challenge = await Challenge.create({ title, description, xpReward: xpReward || 50, division: division || 'global' });
    return NextResponse.json({ challenge }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

