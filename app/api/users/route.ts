import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getUserFromRequest, verifyAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const users = await User.find().select('-password').sort({ xp: -1 });

    // Emails are visible to superadmins only -- strip for plain admins so the
    // restriction can't be bypassed by calling this endpoint directly.
    if (admin.role !== 'superadmin') {
      const sanitized = users.map(u => {
        const obj = u.toObject();
        delete obj.email;
        return obj;
      });
      return NextResponse.json({ users: sanitized });
    }

    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
