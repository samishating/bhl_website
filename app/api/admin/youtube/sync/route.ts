import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { syncAllCreators } from '@/lib/server/youtube';
import { connectDB } from '@/lib/db';

export async function POST() {
  try {
    // Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get('bhl-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const result = await syncAllCreators();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[YouTube Sync All]', err);
    return NextResponse.json({ error: err?.message || 'Sync failed' }, { status: 500 });
  }
}
