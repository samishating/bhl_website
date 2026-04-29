import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getUserFromRequest, verifyAdmin } from '@/lib/auth';
import { Application } from '@/models/Application';

import { Order } from '@/models/Order';

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const pendingSubmissions = await mongoose.connection.db!.collection('submissions').countDocuments({ status: 'pending' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    return NextResponse.json({ pendingApplications, pendingSubmissions, pendingOrders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
