import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    
    let isAuthorized = payload?.role === 'admin' || payload?.role === 'superadmin' || payload?.isAdmin === true;
    
    // Fallback: If token doesn't have role, check the database
    if (!isAuthorized && payload?.userId) {
      await connectDB();
      const user = await User.findById(payload.userId);
      if (user && (user.role === 'admin' || user.role === 'superadmin' || (user as any).isAdmin)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const users = await User.find().select('-password').sort({ xp: -1 });
    
    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
