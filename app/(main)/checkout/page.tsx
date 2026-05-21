import { getServerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CheckoutClient from './CheckoutClient';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Brotherhood Legacy',
  description: 'Complete your Brotherhood Legacy order securely.',
  alternates: {
    canonical: 'https://bhl-website.vercel.app/checkout',
  },
  openGraph: {
    title: 'Checkout | Brotherhood Legacy',
    description: 'Complete your Brotherhood Legacy order securely.',
    url: 'https://bhl-website.vercel.app/checkout',
    siteName: 'Brotherhood Legacy',
    type: 'website',
    images: [
      {
        url: 'https://bhl-website.vercel.app/brand/logo.png',
        width: 1200,
        height: 630,
        alt: 'Brotherhood Legacy Checkout',
      }
    ],
  }
};

export default async function CheckoutPage() {
  const user = await getServerUser();
  if (!user) redirect('/login?redirect=/checkout');
  return <CheckoutClient />;
}
