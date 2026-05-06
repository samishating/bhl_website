import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Access your Brotherhood Legacy account to track your progress, participate in challenges, and manage your profile.',
  alternates: {
    canonical: '/login',
  }
};

export default function LoginPage() {
  return <LoginClient />;
}
