import type { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import { Giveaway } from '@/models/Giveaway';
import GiveawaysFeed, { type PublicGiveaway } from './GiveawaysFeed';
import styles from './page.module.css';

// Status flips purely on the clock, so this page must never be served stale.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DESCRIPTION =
  'Every Brotherhood Legacy Instagram giveaway in one place. Open the live posts, check the entry rules, and see the winners of every draw we have run.';

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
      .select('title postUrl shortcode endDate rules minMentions winnerCount winners rolledAt')
      .sort({ endDate: -1 })
      .lean();
    return JSON.parse(JSON.stringify(giveaways));
  } catch {
    // DB unreachable — render the empty state rather than throwing the whole page.
    return [];
  }
}

export default async function GiveawaysPage() {
  const giveaways = await getGiveaways();

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Brotherhood Legacy</span>
        <h1 className={styles.title}>Giveaways</h1>
        <p className={styles.subtitle}>
          Every giveaway we run, straight from Instagram. Open a live post to enter, or look back
          at the draws that have already been settled.
        </p>
      </header>

      <GiveawaysFeed giveaways={giveaways} />
    </div>
  );
}
