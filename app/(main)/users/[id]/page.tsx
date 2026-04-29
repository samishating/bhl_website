import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import ProfileClient from './ProfileClient';

// User XP and Profile should be SSR (fresh)
export const dynamic = 'force-dynamic';

async function getProfileData(id: string) {
  await connectDB();
  
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const user = await User.findById(id).lean();
  if (!user) return null;

  // Fetch approved submissions
  const submissions = await mongoose.connection.db!.collection('submissions')
    .aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(id), status: 'approved' } },
      { $lookup: { from: 'challenges', localField: 'challengeId', foreignField: '_id', as: 'challenge' } },
      { $unwind: '$challenge' },
      { $project: { _id: 1, challengeId: { title: '$challenge.title', xpReward: '$challenge.xpReward', division: '$challenge.division' }, createdAt: 1 } },
      { $sort: { createdAt: -1 } }
    ]).toArray();

  return {
    user: JSON.parse(JSON.stringify(user)),
    submissions: JSON.parse(JSON.stringify(submissions))
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProfileData(id);

  if (!data) notFound();

  return <ProfileClient initialProfile={data.user} initialSubmissions={data.submissions} />;
}
