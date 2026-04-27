import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Application } from '@/models/Application';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (payload?.role !== 'admin' && payload?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const pendingSubmissions = await mongoose.connection.db!.collection('submissions').countDocuments({ status: 'pending' });

    return NextResponse.json({ pendingApplications, pendingSubmissions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
