import type { Metadata } from 'next';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password | Brotherhood Legacy',
  description: 'Configure a secure new password for your Brotherhood Legacy account to restore access.',
  alternates: {
    canonical: 'https://bhl-website.vercel.app/reset-password',
  },
  openGraph: {
    title: 'Reset Password | Brotherhood Legacy',
    description: 'Configure a secure new password for your Brotherhood Legacy account to restore access.',
    url: 'https://bhl-website.vercel.app/reset-password',
  }
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
