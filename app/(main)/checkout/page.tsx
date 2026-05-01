import { getServerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CheckoutClient from './CheckoutClient';

export const metadata = {
  title: 'Checkout | Brotherhood Legacy',
  description: 'Complete your Brotherhood Legacy order securely.',
};

export default async function CheckoutPage() {
  const user = await getServerUser();
  if (!user) redirect('/login?redirect=/checkout');
  return <CheckoutClient />;
}
