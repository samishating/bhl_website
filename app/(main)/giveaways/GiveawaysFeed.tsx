'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import InstagramEmbed from '@/components/InstagramEmbed';
import { giveawayStatus, rulesSummary, type GiveawayStatus, type GiveawayRule } from '@/lib/giveaways';
import Countdown from './Countdown';
import styles from './page.module.css';

export interface PublicGiveaway {
  _id: string;
  title: string;
  postUrl: string;
  shortcode: string;
  endDate: string;
  rules: GiveawayRule[];
  minMentions: number;
  winnerCount: number;
  winners: { username: string; profileUrl: string; fullName?: string }[];
  rolledAt?: string;
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
  rolled: { label: 'Winners announced', className: styles.badgeRolled },
};

function formatEndDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function GiveawaysFeed({ giveaways }: { giveaways: PublicGiveaway[] }) {
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

  if (giveaways.length === 0) {
    return (
      <section className={styles.emptyState}>
        <p className={styles.emptyTitle}>No giveaways running right now</p>
        <p className={styles.emptyBody}>
          Follow us on Instagram to catch the next drop — every giveaway we run lands on this page.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.feedSection} aria-label="Giveaway feed">
      <div className={styles.filterRow}>
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
          {liveCount > 0
            ? `${liveCount} giveaway${liveCount === 1 ? '' : 's'} open right now`
            : 'No giveaways open right now'}
        </p>
      </div>

      <motion.div
        className={styles.feed}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
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
  );
}

function GiveawayCard({ giveaway, status }: { giveaway: PublicGiveaway; status: GiveawayStatus }) {
  const [showClosedNote, setShowClosedNote] = useState(false);
  const badge = STATUS_BADGE[status];

  return (
    <motion.article
      className={`${styles.card} ${status !== 'active' ? styles.cardEnded : ''}`}
      variants={fadeUp}
      layout
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
    >
      <header className={styles.cardHeader}>
        <div className={styles.cardHeadings}>
          <h2 className={styles.cardTitle}>{giveaway.title}</h2>
          <p className={styles.cardRules}>{rulesSummary(giveaway)}</p>
        </div>
        <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>
      </header>

      <div className={styles.embedWrap}>
        {/* The genuine Instagram embed — dimmed once entries close. */}
        <div className={status === 'active' ? undefined : styles.embedInactive}>
          <InstagramEmbed postUrl={giveaway.postUrl} />
        </div>

        {/*
          embed.js renders its own "View on Instagram" link that can't be cleanly stripped
          out of Instagram's markup, so once entries close a transparent overlay sits on top
          and intercepts the click instead (spec §7).
        */}
        {status === 'awaiting_roll' && (
          <button
            type="button"
            className={styles.overlay}
            onClick={() => setShowClosedNote(v => !v)}
            aria-label="Entries are closed — winners have not been drawn yet"
          />
        )}

        {status === 'rolled' && (
          <Link
            href={`/giveaways/${giveaway.shortcode}`}
            className={styles.overlay}
            aria-label={`See the winners of ${giveaway.title}`}
          >
            <span className={styles.overlayCta}>See the winners</span>
          </Link>
        )}
      </div>

      <AnimatePresence>
        {status === 'awaiting_roll' && showClosedNote && (
          <motion.p
            className={styles.closedNote}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            Entries are closed — winners haven&apos;t been drawn yet. Check back soon.
          </motion.p>
        )}
      </AnimatePresence>

      <footer className={styles.cardFooter}>
        {status === 'active' ? (
          <Countdown endDate={giveaway.endDate} />
        ) : (
          <span className={styles.endedLabel}>Ended {formatEndDate(giveaway.endDate)}</span>
        )}

        {status === 'rolled' && (
          <Link href={`/giveaways/${giveaway.shortcode}`} className={styles.winnersLink}>
            {giveaway.winners.length === 1 ? 'Winner' : `${giveaway.winners.length} winners`} →
          </Link>
        )}
        {status === 'active' && (
          <span className={styles.endsAt}>Closes {formatEndDate(giveaway.endDate)}</span>
        )}
      </footer>
    </motion.article>
  );
}
