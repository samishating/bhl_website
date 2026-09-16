import type { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import { Giveaway } from '@/models/Giveaway';
import { toPublicGiveaway } from '@/lib/giveaways';
import GiveawaysFeed, { type PublicGiveaway } from './GiveawaysFeed';
import styles from './page.module.css';

// Status flips purely on the clock, so this page must never be served stale.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DESCRIPTION =
  'Every Brotherhood Legacy Instagram giveaway in one place. Open the live posts to enter, see when entries close, and find out who won every draw we have run.';

export const metadata: Metadata = {
  title: 'Giveaways',
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://bhl-website.vercel.app/giveaways',
  },
  openGraph: {
    title: 'Giveaways | Brotherhood Legacy',
    description: DESCRIPTION,
    url: 'https://bhl-website.vercel.app/giveaways',
    siteName: 'Brotherhood Legacy',
    type: 'website',
    images: [
      {
        url: 'https://bhl-website.vercel.app/brand/logo.png',
        width: 1200,
        height: 630,
        alt: 'Brotherhood Legacy Giveaways',
      },
    ],
  },
};

async function getGiveaways(): Promise<PublicGiveaway[]> {
  try {
    await connectDB();
    // Entrant snapshots never leave the server (spec §5) — only public fields are selected.
    const giveaways = await Giveaway.find({})
      .select('title postUrl shortcode endDate minTags winnerCount winners rolledAt publishedAt')
      .sort({ endDate: -1 })
      .lean();
    // Drawn winners stay private until a superadmin has checked and published them.
    return JSON.parse(JSON.stringify(giveaways.map(g => toPublicGiveaway(g as { winners?: unknown[]; publishedAt?: Date }))));
  } catch {
    // DB unreachable — render the empty state rather than throwing the whole page.
    return [];
  }
}

export default async function GiveawaysPage() {
  const giveaways = await getGiveaways();

  return (
    <div className={styles.page}>
      {/* Compact intro — the filters sit beside it so the first giveaway fits above the fold. */}
      <GiveawaysFeed giveaways={giveaways}>
        <span className={styles.eyebrow}>Brotherhood Legacy</span>
        <h1 className={styles.title}>Giveaways</h1>
        <p className={styles.subtitle}>Every giveaway we run, straight from Instagram.</p>
      </GiveawaysFeed>
    </div>
  );
}
