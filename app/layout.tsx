import type { Metadata } from 'next';
import { Rajdhani, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { getServerUser } from '@/lib/auth';
import SyncListener from '@/components/SyncListener';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bhl-website.vercel.app'),
  title: {
    default: 'Brotherhood Legacy — BHL | Community Platform',
    template: '%s | Brotherhood Legacy — BHL'
  },
  description: 'The premier community platform for Gaming, Music, Sport & Content creators. Join the Brotherhood, earn XP, and build your legacy.',
  keywords: ['brotherhood legacy', 'bhl', 'gaming community', 'content creators', 'music artists', 'esports', 'ranking system'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Brotherhood Legacy — BHL',
    description: 'Join the Brotherhood. Rise through the ranks.',
    url: 'https://bhl-website.vercel.app',
    siteName: 'Brotherhood Legacy',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brotherhood Legacy — BHL',
    description: 'Join the Brotherhood. Rise through the ranks.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <SyncListener />
              {children}
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
