import type { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
  title: 'Join the Brotherhood | Brotherhood Legacy',
  description: 'Create your account and begin your journey. Earn XP, rise through the ranks, and join an elite community of creators.',
  alternates: {
    canonical: 'https://bhl-website.vercel.app/register',
  },
  openGraph: {
    title: 'Join the Brotherhood | Brotherhood Legacy',
    description: 'Create your account and begin your journey. Earn XP, rise through the ranks, and join an elite community of creators.',
    url: 'https://bhl-website.vercel.app/register',
    siteName: 'Brotherhood Legacy',
    type: 'website',
    images: [
      {
        url: 'https://bhl-website.vercel.app/brand/logo.png',
        width: 1200,
        height: 630,
        alt: 'Brotherhood Legacy Registration',
      }
    ],
  }
};

export default function RegisterPage() {
  return <RegisterClient />;
}
