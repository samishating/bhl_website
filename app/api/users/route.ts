import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    console.log('[API/USERS] Auth Payload:', payload);
    
    const isAuthorized = payload?.role === 'admin' || payload?.role === 'superadmin' || payload?.isAdmin === true;
    if (!isAuthorized) {
      console.log('[API/USERS] Access Denied for:', payload?.username);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const users = await User.find().select('-password').sort({ xp: -1 });
    
    // DEBUG: Add a mock user to see if it shows up on the frontend
    const debugUsers = [
      { _id: 'debug-1', username: 'DEBUG_USER', email: 'debug@test.com', xp: 1000, level: 5, divisions: ['gaming'], badges: [], role: 'user', createdAt: new Date().toISOString() },
      ...users
    ];
    
    return NextResponse.json({ users: debugUsers });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
