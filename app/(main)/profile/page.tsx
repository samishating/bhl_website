import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Your Profile | Brotherhood Legacy',
  description: 'Manage your digital presence, social links, biography, and division badges within the Brotherhood Legacy community network.',
  alternates: {
    canonical: 'https://bhl-website.vercel.app/profile',
  },
  openGraph: {
    title: 'Your Profile | Brotherhood Legacy',
    description: 'Manage your digital presence, social links, biography, and division badges within the Brotherhood Legacy community network.',
    url: 'https://bhl-website.vercel.app/profile',
    type: 'profile',
  }
};

export default function ProfilePage() {
  return <ProfileClient />;
}
