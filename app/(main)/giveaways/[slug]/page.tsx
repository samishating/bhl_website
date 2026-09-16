import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Giveaway } from '@/models/Giveaway';
import InstagramEmbed from '@/components/InstagramEmbed';
import { entrySummary, entrantLabel, platformOf, PLATFORM_LABELS } from '@/lib/giveaways';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://bhl-website.vercel.app';

interface WinnersRecord {
  title: string;
  postUrl: string;
  shortcode: string;
  endDate: string;
  minTags?: number;
  winnerCount: number;
  rolledAt?: string;
  winners: { username: string; profileUrl: string; fullName?: string }[];
}

async function getGiveaway(slug: string): Promise<WinnersRecord | null> {
  try {
    await connectDB();
    const giveaway = await Giveaway.findOne({ shortcode: slug })
      .select('title postUrl shortcode endDate minTags winnerCount winners rolledAt publishedAt')
      .lean() as { publishedAt?: Date } | null;
    // No winners page until the result is published — drawn winners may still be redrawn.
    if (!giveaway || !giveaway.publishedAt) return null;
    return JSON.parse(JSON.stringify(giveaway));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const giveaway = await getGiveaway(slug);

  if (!giveaway || giveaway.winners.length === 0) {
    return { title: 'Giveaway not found', robots: { index: false, follow: true } };
  }

  const names = giveaway.winners.map(entrantLabel).join(', ');
  const description = `${giveaway.title} has been drawn. ${
    giveaway.winners.length === 1 ? 'The winner is' : 'The winners are'
  } ${names}. See the full result and the original Instagram post.`;

  return {
    title: `${giveaway.title} — Winners`,
    description: description.slice(0, 160),
    alternates: { canonical: `${BASE_URL}/giveaways/${giveaway.shortcode}` },
    openGraph: {
      title: `${giveaway.title} — Winners | Brotherhood Legacy`,
      description: description.slice(0, 160),
      url: `${BASE_URL}/giveaways/${giveaway.shortcode}`,
      siteName: 'Brotherhood Legacy',
      type: 'article',
      images: [
        {
          url: `${BASE_URL}/brand/logo.png`,
          width: 1200,
          height: 630,
          alt: `${giveaway.title} winners`,
        },
      ],
    },
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
}

export default async function GiveawayWinnersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const giveaway = await getGiveaway(slug);

  // A giveaway only has a winners page once it has actually been rolled (spec §7).
  if (!giveaway || giveaway.winners.length === 0) notFound();

  const multiple = giveaway.winners.length > 1;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/giveaways" className={styles.backLink}>← All giveaways</Link>
      </nav>

      <header className={styles.hero}>
        <span className={styles.eyebrow}>Result</span>
        <h1 className={styles.title}>{giveaway.title}</h1>
        <p className={styles.meta}>
          Entries closed {formatDate(giveaway.endDate)}
          {giveaway.rolledAt && <> · Drawn {formatDate(giveaway.rolledAt)}</>}
        </p>
        <p className={styles.rules}>{entrySummary(giveaway.minTags, giveaway.winnerCount)}</p>
      </header>

      <div className={styles.layout}>
        <section className={styles.postPanel} aria-label="The giveaway post">
          <InstagramEmbed postUrl={giveaway.postUrl} />
        </section>

        <section className={styles.winnersPanel} aria-labelledby="winners-heading">
          <h2 id="winners-heading" className={styles.winnersHeading}>
            {multiple ? `${giveaway.winners.length} Winners` : 'Winner'}
          </h2>

          <ul className={styles.winnerList}>
            {giveaway.winners.map((winner, index) => (
              <li key={winner.username} className={styles.winnerItem}>
                <span className={styles.winnerRank}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.winnerIdentity}>
                  <a
                    href={winner.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.winnerHandle}
                  >
                    {entrantLabel(winner)}
                  </a>
                  <span className={styles.winnerName}>
                    {PLATFORM_LABELS[platformOf(winner.username)]}
                    {/* Instagram shows the handle above, so the real name adds something; on Facebook the name is already the label. */}
                    {winner.fullName && platformOf(winner.username) === 'instagram' && ` · ${winner.fullName}`}
                  </span>
                </span>
                <span className={styles.winnerGo} aria-hidden="true">↗</span>
              </li>
            ))}
          </ul>

          <p className={styles.winnersNote}>
            Winners were drawn at random from every unique account that met the entry condition, then checked by hand
            before being announced. Tap a winner to open their profile.
          </p>
        </section>
      </div>
    </div>
  );
}
