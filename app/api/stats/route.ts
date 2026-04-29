import { NextResponse } from 'next/server';
import { getLiveStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getLiveStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
