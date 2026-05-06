import type { Metadata } from 'next';
import ApplyClient from './ApplyClient';

export const metadata: Metadata = {
  title: 'Apply as Creator',
  description: 'Join the Brotherhood Legacy Creators Program. Apply to become an official Content Creator, Gaming Creator, Music Artist, or Sports Personality.',
  alternates: {
    canonical: '/apply',
  }
};

export default function ApplyPage() {
  return <ApplyClient />;
}
