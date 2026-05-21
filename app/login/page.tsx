import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Login | Brotherhood Legacy',
  description: 'Access your Brotherhood Legacy account to track your progress, participate in challenges, and manage your profile.',
  alternates: {
    canonical: 'https://bhl-website.vercel.app/login',
  },
  openGraph: {
    title: 'Login | Brotherhood Legacy',
    description: 'Access your Brotherhood Legacy account to track your progress, participate in challenges, and manage your profile.',
    url: 'https://bhl-website.vercel.app/login',
    siteName: 'Brotherhood Legacy',
    type: 'website',
    images: [
      {
        url: 'https://bhl-website.vercel.app/brand/logo.png',
        width: 1200,
        height: 630,
        alt: 'Brotherhood Legacy Login',
      }
    ],
  }
};

export default function LoginPage() {
  return <LoginClient />;
}
