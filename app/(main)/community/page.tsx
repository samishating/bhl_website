import type { Metadata } from 'next';
export const revalidate = 60;
import CommunityClient from './CommunityClient';

export const metadata: Metadata = {
  title: 'Community Network | Brotherhood Legacy',
  description: 'Meet the heartbeat of the Brotherhood. Explore profiles of gaming creators, music artists, and community leaders building their legacy.',
  alternates: {
    canonical: 'https://bhl-website.vercel.app/community',
  },
  openGraph: {
    title: 'Community Network | Brotherhood Legacy',
    description: 'Meet the heartbeat of the Brotherhood. Explore profiles of gaming creators, music artists, and community leaders building their legacy.',
    url: 'https://bhl-website.vercel.app/community',
    siteName: 'Brotherhood Legacy',
    type: 'website',
    images: [
      {
        url: 'https://bhl-website.vercel.app/brand/logo.png',
        alt: 'BHL Logo',
      }
    ],
  }
};

export default function CommunityPage() {
  return <CommunityClient />;
}
