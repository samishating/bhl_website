import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { syncCreator } from '@/lib/server/youtube';
import { connectDB } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('bhl_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const result = await syncCreator(userId);
    return NextResponse.json({ success: !result.error, ...result });
  } catch (err: any) {
    console.error('[YouTube Sync User]', err);
    return NextResponse.json({ error: err?.message || 'Sync failed' }, { status: 500 });
  }
}
