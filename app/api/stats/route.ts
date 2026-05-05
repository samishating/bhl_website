import { NextResponse } from 'next/server';
import { getLiveStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getLiveStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
