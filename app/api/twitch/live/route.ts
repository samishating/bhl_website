import { NextResponse } from 'next/server';
import { getTwitchLiveStreams } from '@/lib/server/twitch';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const streams = await getTwitchLiveStreams();
    return NextResponse.json({ live: streams }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (err: any) {
    console.error('[Twitch API Route Failure]', err);
    // Safe fallback so the website never crashes
    return NextResponse.json({ live: [] }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10'
      }
    });
  }
}
