import type { Metadata } from 'next';
import './globals.css';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
