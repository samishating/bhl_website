import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (payload?.role !== 'admin' && payload?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { status, makePublic } = await req.json();

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await connectDB();
    const application = await Application.findByIdAndUpdate(id, { 
      status,
      processedBy: payload.userId,
      processedAt: new Date()
    }, { new: true });

    if (status === 'approved' && application.userId) {
      const { User } = await import('@/models/User');
      const divisionToAdd = application.type === 'creator' ? `${application.division}_creator` : application.division;
      const updateDoc: any = { $addToSet: { divisions: divisionToAdd } };
      if (makePublic) updateDoc.$set = { isPublic: true };
      await User.findByIdAndUpdate(application.userId, updateDoc);
    }
    
    return NextResponse.json({ application });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
