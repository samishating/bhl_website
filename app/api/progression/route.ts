import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SystemSettings } from '@/models/SystemSettings';
import { LEVEL_THRESHOLDS, LEVEL_TITLES } from '@/lib/xp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const settings = await SystemSettings.findOne({ key: 'main' });
    
    if (!settings || !settings.levelProgression || settings.levelProgression.length === 0) {
      // Fallback to hardcoded defaults
      const defaultProgression = LEVEL_THRESHOLDS.map((xp, i) => ({
        level: i + 1,
        title: LEVEL_TITLES[i] || `Level ${i + 1}`,
        xpRequired: xp
      }));
      return NextResponse.json({ progression: defaultProgression }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      });
    }

    return NextResponse.json({ progression: settings.levelProgression }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    console.error('[PROGRESSION_GET_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch progression' }, { status: 500 });
  }
}
