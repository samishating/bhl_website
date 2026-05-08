/**
 * GET /api/cron/youtube-sync
 *
 * Triggered daily at 04:00 UTC ≈ 05:00 Morocco time (UTC+1) by Vercel cron.
 * Protected by CRON_SECRET environment variable.
 *
 * Call manually:
 *   curl -X GET https://bhl-website.vercel.app/api/cron/youtube-sync \
 *     -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
import { NextResponse } from 'next/server';
import { syncAllCreators } from '@/lib/server/youtube';
import { connectDB } from '@/lib/db';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  const isVercelCron = req.headers.get('x-vercel-cron') === '1';

  if (!isVercelCron && (!secret || authHeader !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const result = await syncAllCreators();
    console.log('[Cron] YouTube sync complete:', result);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[Cron] YouTube sync failed:', err);
    return NextResponse.json({ error: err?.message || 'Sync failed' }, { status: 500 });
  }
}
