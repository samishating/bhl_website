import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { CreatorVideo } from '@/models/CreatorVideo';

export async function PATCH(req: Request, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const { videoId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('bhl_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const allowed = ['isHidden', 'isFeatured'];
    const update: Record<string, boolean> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    await connectDB();
    const video = await CreatorVideo.findOneAndUpdate(
      { videoId },
      { $set: update },
      { new: true }
    );

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    return NextResponse.json({ success: true, video });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
