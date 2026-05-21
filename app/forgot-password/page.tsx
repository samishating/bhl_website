import type { Metadata } from 'next';
import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata: Metadata = {
  title: 'Forgot Password | Brotherhood Legacy',
  description: 'Recover your account password. Enter your registered email address to receive a secure recovery link.',
  alternates: {
    canonical: 'https://bhl-website.vercel.app/forgot-password',
  },
  openGraph: {
    title: 'Forgot Password | Brotherhood Legacy',
    description: 'Recover your account password. Enter your registered email address to receive a secure recovery link.',
    url: 'https://bhl-website.vercel.app/forgot-password',
  }
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
