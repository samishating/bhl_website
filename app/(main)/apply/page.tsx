import type { Metadata } from 'next';
import ApplyClient from './ApplyClient';

export const metadata: Metadata = {
  title: 'Apply as Creator | Brotherhood Legacy',
  description: 'Join the Brotherhood Legacy Creators Program. Apply to become an official Content Creator, Gaming Creator, Music Artist, or Sports Personality.',
  alternates: {
    canonical: 'https://bhl-website.vercel.app/apply',
  },
  openGraph: {
    title: 'Apply as Creator | Brotherhood Legacy',
    description: 'Join the Brotherhood Legacy Creators Program. Apply to become an official Content Creator, Gaming Creator, Music Artist, or Sports Personality.',
    url: 'https://bhl-website.vercel.app/apply',
    siteName: 'Brotherhood Legacy',
    type: 'website',
    images: [
      {
        url: 'https://bhl-website.vercel.app/brand/logo.png',
        width: 1200,
        height: 630,
        alt: 'Brotherhood Legacy Creator Application',
      }
    ],
  }
};

export default function ApplyPage() {
  return <ApplyClient />;
}
