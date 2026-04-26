import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
// Make sure models are registered
import '@/models/Challenge';

export async function GET() {
  try {
    await connectDB();
    const totalMembers = await User.countDocuments();
    
    const xpResult = await User.aggregate([
      { $group: { _id: null, totalXP: { $sum: '$xp' } } }
    ]);
    const totalXP = xpResult[0]?.totalXP || 0;

    const divisionResult = await User.aggregate([
      { $unwind: '$divisions' },
      { $group: { _id: '$divisions', count: { $sum: 1 } } }
    ]);
    
    const divisionCounts = {
      gaming: 0, music: 0, sport: 0, content: 0
    };
    divisionResult.forEach(d => {
      if (divisionCounts[d._id as keyof typeof divisionCounts] !== undefined) {
        divisionCounts[d._id as keyof typeof divisionCounts] = d.count;
      }
    });

    const completedChallenges = await mongoose.connection.db!.collection('submissions').countDocuments({ status: 'approved' });

    return NextResponse.json({
      totalMembers,
      totalXP,
      divisionCounts,
      completedChallenges
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
