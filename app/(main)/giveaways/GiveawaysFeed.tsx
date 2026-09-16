'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import InstagramEmbed from '@/components/InstagramEmbed';
import { giveawayStatus, entrySummary, type GiveawayStatus } from '@/lib/giveaways';
import Countdown from './Countdown';
import styles from './page.module.css';

export interface PublicGiveaway {
  _id: string;
  title: string;
  postUrl: string;
  shortcode: string;
  endDate: string;
  minTags?: number;
  winnerCount: number;
  winners: { username: string; profileUrl: string; fullName?: string }[];
  rolledAt?: string;
  publishedAt?: string;
}

type Filter = 'all' | 'live' | 'ended';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'ended', label: 'Ended' },
];

const STATUS_BADGE: Record<GiveawayStatus, { label: string; className: string }> = {
  active: { label: 'Accepting entries', className: styles.badgeActive },
  awaiting_roll: { label: 'Entries closed', className: styles.badgeClosed },
  // Never reaches the public (unpublished winners are stripped server-side), but reads
  // the same as "entries closed" if it ever did.
  drawn: { label: 'Entries closed', className: styles.badgeClosed },
  rolled: { label: 'Winners announced', className: styles.badgeRolled },
};

function formatEndDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

interface FeedProps {
  giveaways: PublicGiveaway[];
  /** The page intro (eyebrow, h1, subtitle), laid out beside the filters in one compact bar. */
  children: React.ReactNode;
}

export default function GiveawaysFeed({ giveaways, children }: FeedProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const { shouldReduce } = useMotionConfig();

  // Live giveaways first (soonest to close at the top), then settled ones most-recent-first.
  const ordered = useMemo(() => {
    const withStatus = giveaways.map(g => ({ giveaway: g, status: giveawayStatus(g) }));
    const live = withStatus
      .filter(x => x.status === 'active')
      .sort((a, b) => +new Date(a.giveaway.endDate) - +new Date(b.giveaway.endDate));
    const ended = withStatus
      .filter(x => x.status !== 'active')
      .sort((a, b) => +new Date(b.giveaway.endDate) - +new Date(a.giveaway.endDate));
    return [...live, ...ended];
  }, [giveaways]);

  const visible = useMemo(() => {
    if (filter === 'live') return ordered.filter(x => x.status === 'active');
    if (filter === 'ended') return ordered.filter(x => x.status !== 'active');
    return ordered;
  }, [ordered, filter]);

  const liveCount = ordered.filter(x => x.status === 'active').length;

  return (
    <>
      <header className={styles.topBar}>
        <div className={styles.intro}>{children}</div>

        {giveaways.length > 0 && (
          <div className={styles.filters}>
            <div className="selection-pill-group" role="tablist" aria-label="Filter giveaways">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`selection-pill selection-pill-compact ${filter === f.key ? 'selection-pill-active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {filter === f.key && (
                    <motion.span
                      layoutId="giveaway-filter-indicator"
                      className="selection-pill-indicator"
                      transition={shouldReduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className="selection-pill-label">{f.label}</span>
                </button>
              ))}
            </div>
            <p className={styles.filterMeta}>
              {liveCount > 0 ? `${liveCount} open now` : 'None open right now'}
            </p>
          </div>
        )}
      </header>

      {giveaways.length === 0 ? (
        <section className={styles.emptyState}>
          <p className={styles.emptyTitle}>No giveaways running right now</p>
          <p className={styles.emptyBody}>
            Follow us on Instagram to catch the next drop — every giveaway we run lands on this page.
          </p>
        </section>
      ) : (
        <section aria-label="Giveaway feed">
          <motion.div className={styles.feed} variants={staggerContainer} initial="hidden" animate="visible">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map(({ giveaway, status }) => (
                <GiveawayCard key={giveaway._id} giveaway={giveaway} status={status} />
              ))}
            </AnimatePresence>
          </motion.div>

          {visible.length === 0 && (
            <p className={styles.filterEmpty}>
              {filter === 'live' ? 'Nothing is open at the moment.' : 'No giveaways have ended yet.'}
            </p>
          )}
        </section>
      )}
    </>
  );
}

function GiveawayCard({ giveaway, status }: { giveaway: PublicGiveaway; status: GiveawayStatus }) {
  const badge = STATUS_BADGE[status];
  const winnersHref = `/giveaways/${giveaway.shortcode}`;

  return (
    <motion.article
      className={`${styles.card} ${status !== 'active' ? styles.cardEnded : ''}`}
      variants={fadeUp}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
    >
      {/* Post on the left at Instagram's minimum embed width, so the card is only as tall as the post. */}
      <div className={styles.embedWrap}>
        <div className={status === 'active' ? undefined : styles.embedInactive}>
          <InstagramEmbed postUrl={giveaway.postUrl} />
        </div>

        {/*
          embed.js renders its own "View on Instagram" link that can't be cleanly stripped
          out of Instagram's markup, so once entries close a transparent overlay sits on top
          and intercepts the click instead (spec §7).
        */}
        {status === 'awaiting_roll' && (
          <div className={`${styles.overlay} ${styles.overlayBlock}`} aria-hidden="true" />
        )}
        {status === 'rolled' && (
          <Link href={winnersHref} className={styles.overlay} aria-label={`See the winners of ${giveaway.title}`}>
            <span className={styles.overlayCta}>See the winners</span>
          </Link>
        )}
      </div>

      <div className={styles.info}>
        <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>
        <h2 className={styles.cardTitle}>{giveaway.title}</h2>
        <p className={styles.cardRules}>{entrySummary(giveaway.minTags, giveaway.winnerCount)}</p>

        <div className={styles.infoBlock}>
          {status === 'active' ? (
            <>
              <Countdown endDate={giveaway.endDate} />
              <span className={styles.endsAt}>Closes {formatEndDate(giveaway.endDate)}</span>
            </>
          ) : (
            <span className={styles.endedLabel}>Ended {formatEndDate(giveaway.endDate)}</span>
          )}
        </div>

        {status === 'active' && (
          <a href={giveaway.postUrl} target="_blank" rel="noopener noreferrer" className={`btn btn-primary ${styles.cta}`}>
            Enter on Instagram ↗
          </a>
        )}
        {status === 'awaiting_roll' && (
          <p className={styles.closedNote}>
            Entries are closed — winners haven&apos;t been drawn yet. Check back soon.
          </p>
        )}
        {status === 'rolled' && (
          <Link href={winnersHref} className={`btn btn-primary ${styles.cta}`}>
            {giveaway.winners.length === 1 ? 'See the winner' : `See the ${giveaway.winners.length} winners`} →
          </Link>
        )}
      </div>
    </motion.article>
  );
}
