import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Fetch all public users
    const publicUsers = await User.find({ isPublic: true })
      .select('-password -email')
      .sort({ displayOrder: -1, xp: -1 })
      .lean();
      
    // Separate featured creators from the rest
    const featuredCreators = publicUsers.filter(u => u.isFeatured);
    const members = publicUsers.filter(u => !u.isFeatured);

    return NextResponse.json({ featuredCreators, members });
  } catch (err) {
    console.error('[CommunityAPI] GET Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
