'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import { eligiblePool, entrantLabel } from '@/lib/giveaways';
import type { AdminGiveaway } from './page';
import styles from './page.module.css';

type Winner = { username: string; profileUrl: string; fullName?: string };
type Phase = 'ready' | 'shuffling' | 'revealed';

const SHUFFLE_MS = 2800;
const TICK_MS = 70;

interface Props {
  giveaway: AdminGiveaway;
  onClose: () => void;
  onRolled: () => void;
}

export default function RollModal({ giveaway, onClose, onRolled }: Props) {
  const { showToast } = useToast();
  const { shouldReduce } = useMotionConfig();

  const [phase, setPhase] = useState<Phase>('ready');
  const [winners, setWinners] = useState<Winner[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [ticker, setTicker] = useState<string[]>([]);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const eligible = useMemo(
    () => eligiblePool(giveaway.entrants || [], giveaway.minTags),
    [giveaway]
  );

  // Never leave the ticker running if the modal unmounts mid-draw.
  useEffect(() => () => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (stopRef.current) clearTimeout(stopRef.current);
  }, []);

  const startRoll = async () => {
    const res = await fetch(`/api/giveaways/${giveaway._id}/roll`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showToast(data.error || 'Roll failed', 'error');
      return;
    }

    setWinners(data.winners);
    setPool(data.pool || []);

    // The result is already decided server-side; the shuffle is purely presentational.
    if (shouldReduce || !data.pool?.length) {
      setPhase('revealed');
      return;
    }

    setPhase('shuffling');
    tickerRef.current = setInterval(() => {
      setTicker(
        Array.from({ length: giveaway.winnerCount }, () =>
          data.pool[Math.floor(Math.random() * data.pool.length)]
        )
      );
    }, TICK_MS);

    stopRef.current = setTimeout(() => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      setPhase('revealed');
    }, SHUFFLE_MS);
  };

  const handleClose = () => {
    if (phase === 'revealed') onRolled();
    else onClose();
  };

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title={phase === 'revealed' ? 'Result' : `Roll — ${giveaway.title}`}
      maxWidth="560px"
      footer={
        phase === 'ready' ? (
          <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={startRoll}
              disabled={eligible.length < giveaway.winnerCount}
              style={{ flex: 1 }}
            >
              START ROLL
            </button>
          </div>
        ) : phase === 'revealed' ? (
          <button className="btn btn-primary" onClick={handleClose} style={{ width: '100%' }}>
            DONE
          </button>
        ) : undefined
      }
    >
      {phase === 'ready' && (
        <div className={styles.rollReady}>
          <div className={styles.reviewSummary}>
            <div className={styles.reviewStat}>
              <span className={styles.reviewStatValue}>{eligible.length}</span>
              <span className={styles.reviewStatLabel}>Eligible</span>
            </div>
            <div className={styles.reviewStat}>
              <span className={styles.reviewStatValue}>{giveaway.winnerCount}</span>
              <span className={styles.reviewStatLabel}>Winners</span>
            </div>
          </div>

          {eligible.length < giveaway.winnerCount ? (
            <p className={styles.shortfallWarning}>
              Only {eligible.length} eligible entrant{eligible.length === 1 ? '' : 's'} for{' '}
              {giveaway.winnerCount} winner{giveaway.winnerCount === 1 ? '' : 's'}. Lower the winner count
              or the required tags, or reinstate excluded entrants, before rolling.
            </p>
          ) : (
            <p className={styles.rollNote}>
              Winners are drawn with a uniform shuffle from the eligible pool. Nothing goes public
              yet — you&apos;ll check each winner and redraw anyone who doesn&apos;t qualify before publishing.
            </p>
          )}
        </div>
      )}

      {phase === 'shuffling' && (
        <div className={styles.rollStage} aria-live="polite" aria-label="Drawing winners">
          {Array.from({ length: giveaway.winnerCount }).map((_, i) => (
            <div key={i} className={styles.rollSlot}>
              <span className={styles.rollSlotName}>{ticker[i] || pool[0]}</span>
            </div>
          ))}
          <p className={styles.rollNote}>Drawing...</p>
        </div>
      )}

      {phase === 'revealed' && (
        <div className={styles.rollStage} aria-live="polite">
          <AnimatePresence>
            {winners.map((winner, index) => (
              <motion.a
                key={winner.username}
                href={winner.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.rollWinner}
                initial={shouldReduce ? false : { opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={shouldReduce ? { duration: 0 } : { duration: 0.35, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className={styles.rollWinnerRank}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.rollWinnerHandle}>{entrantLabel(winner)}</span>
                <span className={styles.rollWinnerGo} aria-hidden="true">↗</span>
              </motion.a>
            ))}
          </AnimatePresence>
          <p className={styles.rollNote}>
            Drawn, not public yet. Check each winner did what the post asked, redraw anyone who
            doesn&apos;t, then hit Publish on the giveaway card.
          </p>
        </div>
      )}
    </Modal>
  );
}
