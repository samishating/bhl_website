import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SystemSettings } from '@/models/SystemSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const settings = await SystemSettings.findOne({ key: 'main' });

    if (!settings || !settings.levelProgression || settings.levelProgression.length === 0) {
      return NextResponse.json(
        { error: 'No level progression configured. Set up progression via the admin XP panel.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ progression: settings.levelProgression });
  } catch (err) {
    console.error('[PROGRESSION_GET_ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch progression' }, { status: 500 });
  }
}
