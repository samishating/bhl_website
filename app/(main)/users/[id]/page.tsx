import { notFound } from 'next/navigation';
export const revalidate = 60;
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import ProfileClient from './ProfileClient';
import type { Metadata } from 'next';

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getProfileData(id);
  if (!data) {
    return {
      title: 'Member Profile Not Found | Brotherhood Legacy',
      description: 'The requested member profile could not be found.'
    };
  }

  const username = data.user.username;
  const level = data.user.level || 1;
  const bio = data.user.bio || `BHL Member level ${level}. Join the Brotherhood Legacy network.`;

  return {
    title: `${username} — Profile | Brotherhood Legacy`,
    description: bio.length > 155 ? bio.slice(0, 155) + '...' : bio,
    alternates: {
      canonical: `https://bhl-website.vercel.app/users/${id}`,
    },
    openGraph: {
      title: `${username} — Member Profile`,
      description: bio,
      url: `https://bhl-website.vercel.app/users/${id}`,
      siteName: 'Brotherhood Legacy',
      type: 'profile',
      images: [
        {
          url: data.user.avatar || 'https://bhl-website.vercel.app/brand/logo.png',
          alt: `${username}'s Avatar`,
        }
      ],
    }
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProfileData(id);

  if (!data) notFound();

  const user = data.user;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.username,
    description: user.bio || `BHL Member level ${user.level || 1}`,
    url: `https://bhl-website.vercel.app/users/${user._id}`,
    image: user.avatar || 'https://bhl-website.vercel.app/brand/logo.png',
    knowsAbout: user.divisions || []
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProfileClient initialProfile={data.user} initialSubmissions={data.submissions} />
    </>
  );
}
