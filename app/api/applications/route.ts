import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fullName, email, socialLink, reason } = body;

    if (!fullName || !email || !socialLink || !reason) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await connectDB();
    const application = await Application.create({
      userId: payload.userId,
      fullName,
      email,
      socialLink,
      reason
    });

    return NextResponse.json({ application, message: 'Application submitted successfully!' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (payload?.role !== 'admin' && payload?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const applications = await Application.find()
      .populate('userId', 'username avatar xp level')
      .sort({ createdAt: -1 });

    return NextResponse.json({ applications });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
