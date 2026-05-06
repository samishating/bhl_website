import type { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
  title: 'Join the Brotherhood',
  description: 'Create your account and begin your journey. Earn XP, rise through the ranks, and join an elite community of creators.',
  alternates: {
    canonical: '/register',
  }
};

export default function RegisterPage() {
  return <RegisterClient />;
}
