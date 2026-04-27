import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { getServerUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Brotherhood Legacy — BHL | Community Platform',
  description: 'The premier community platform for Gaming, Music, Sport & Content creators. Join the Brotherhood, earn XP, rise through the ranks.',
  keywords: 'brotherhood legacy, bhl, community, gaming, music, sport, content',
  openGraph: {
    title: 'Brotherhood Legacy — BHL',
    description: 'Join the Brotherhood. Rise through the ranks.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  return (
    <html lang="en">
      <body>
        <AuthProvider initialUser={user}>
          <CartProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
