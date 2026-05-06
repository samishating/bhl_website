import type { Metadata } from 'next';
import CommunityClient from './CommunityClient';

export const metadata: Metadata = {
  title: 'Community Network',
  description: 'Meet the heartbeat of the Brotherhood. Explore profiles of gaming creators, music artists, and community leaders building their legacy.',
  alternates: {
    canonical: '/community',
  }
};

export default function CommunityPage() {
  return <CommunityClient />;
}
