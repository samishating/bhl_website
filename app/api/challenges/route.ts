import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Challenge } from '@/models/Challenge';
import { verifyAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const division = searchParams.get('division');
    const query: Record<string, unknown> = { active: true };
    if (division && division !== 'global') query.division = division;
    
    const challenges = await Challenge.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ challenges }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { title, description, xpReward, division, allowRepeats } = await req.json();
    if (!title || !description) return NextResponse.json({ error: 'Title and description required' }, { status: 400 });

    const challenge = await Challenge.create({ 
      title, 
      description, 
      xpReward: xpReward || 50, 
      division: division || 'global',
      allowRepeats: !!allowRepeats 
    });
    return NextResponse.json({ challenge }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

