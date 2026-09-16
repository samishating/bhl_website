'use client';
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { fadeUp, staggerContainer } from '@/lib/animations';
import ConfirmationModal from '@/components/ConfirmationModal';
import { giveawayStatus, evaluateEntrant, rulesSummary, type GiveawayStatus, type GiveawayRule, type GiveawayEntrant } from '@/lib/giveaways';
import GiveawayFormModal from './GiveawayFormModal';
import EntrantsModal from './EntrantsModal';
import RollModal from './RollModal';
import styles from './page.module.css';

export interface AdminGiveaway {
  _id: string;
  title: string;
  postUrl: string;
  shortcode: string;
  mediaId?: string;
  endDate: string;
  rules: GiveawayRule[];
  minMentions: number;
  winnerCount: number;
  entrants: GiveawayEntrant[];
  entrantsCapturedAt?: string;
  entrantsSource?: 'userscript' | 'manual';
  ownerUsername?: string;
  winners: { username: string; profileUrl: string; fullName?: string }[];
  rolledAt?: string;
}

const STATUS_META: Record<GiveawayStatus, { label: string; className: string }> = {
  active: { label: 'Live', className: styles.statusActive },
  awaiting_roll: { label: 'Awaiting roll', className: styles.statusAwaiting },
  rolled: { label: 'Rolled', className: styles.statusRolled },
};

export default function AdminGiveawaysPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isSuperadmin = user?.role === 'superadmin';

  const [giveaways, setGiveaways] = useState<AdminGiveaway[]>([]);
  const [loading, setLoading] = useState(true);

  const [formTarget, setFormTarget] = useState<AdminGiveaway | null | undefined>(undefined);
  const [entrantsTarget, setEntrantsTarget] = useState<AdminGiveaway | null>(null);
  const [rollTarget, setRollTarget] = useState<AdminGiveaway | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminGiveaway | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/giveaways', { cache: 'no-store' });
      const data = await res.json();
      setGiveaways(data.giveaways || []);
    } catch {
      showToast('Could not load giveaways', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(
    () => giveaways.map(g => ({ giveaway: g, status: giveawayStatus(g) })),
    [giveaways]
  );

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    const res = await fetch(`/api/giveaways/${removeTarget._id}`, { method: 'DELETE' });
    setRemoving(false);
    if (res.ok) {
      showToast('Giveaway removed', 'info');
      setRemoveTarget(null);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'Could not remove giveaway', 'error');
      setRemoveTarget(null);
    }
  };

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Giveaways</h1>
            <p className={styles.sub}>
              {giveaways.length} giveaway{giveaways.length === 1 ? '' : 's'} · managed here only, never on the public page
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setFormTarget(null)}>
            + Add Giveaway
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className="loader-visual" style={{ margin: '0 auto' }}>
              <div className="loader-arc" />
              <img src="/brand/logo.png" alt="" className="loader-logo" />
            </div>
            <p className="loader-text" style={{ marginTop: '2rem' }}>Scanning Giveaways...</p>
          </div>
        ) : giveaways.length === 0 ? (
          <div className={styles.empty}>
            <p>No giveaways yet — add one to publish it to the public feed.</p>
          </div>
        ) : (
          <motion.div className={styles.grid} variants={staggerContainer}>
            {rows.map(({ giveaway, status }) => (
              <GiveawayRow
                key={giveaway._id}
                giveaway={giveaway}
                status={status}
                isSuperadmin={isSuperadmin}
                onEdit={() => setFormTarget(giveaway)}
                onEntrants={() => setEntrantsTarget(giveaway)}
                onRoll={() => setRollTarget(giveaway)}
                onRemove={() => setRemoveTarget(giveaway)}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {formTarget !== undefined && (
        <GiveawayFormModal
          giveaway={formTarget}
          onClose={() => setFormTarget(undefined)}
          onSaved={() => { setFormTarget(undefined); load(); }}
        />
      )}

      {entrantsTarget && (
        <EntrantsModal
          giveaway={entrantsTarget}
          isSuperadmin={isSuperadmin}
          onClose={() => setEntrantsTarget(null)}
          onChanged={updated => { setEntrantsTarget(updated); load(); }}
        />
      )}

      {rollTarget && (
        <RollModal
          giveaway={rollTarget}
          onClose={() => setRollTarget(null)}
          onRolled={() => { setRollTarget(null); load(); }}
        />
      )}

      <ConfirmationModal
        isOpen={!!removeTarget}
        title="Remove giveaway"
        message={
          removeTarget
            ? `"${removeTarget.title}" will be deleted and disappear from the public feed. Its entrant snapshot goes with it. This can't be undone.`
            : ''
        }
        confirmLabel={removing ? 'Removing...' : 'Remove'}
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
}

function GiveawayRow({
  giveaway,
  status,
  isSuperadmin,
  onEdit,
  onEntrants,
  onRoll,
  onRemove,
}: {
  giveaway: AdminGiveaway;
  status: GiveawayStatus;
  isSuperadmin: boolean;
  onEdit: () => void;
  onEntrants: () => void;
  onRoll: () => void;
  onRemove: () => void;
}) {
  const meta = STATUS_META[status];
  const locked = status === 'rolled';

  const entrantCount = giveaway.entrants?.length || 0;
  const eligibleCount = useMemo(
    () => (giveaway.entrants || []).filter(e => evaluateEntrant(e, giveaway).eligible).length,
    [giveaway]
  );

  const canRoll = isSuperadmin && status === 'awaiting_roll';

  return (
    <motion.div className={styles.card} variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <div className={styles.cardTop}>
        <div className={styles.cardHeadings}>
          <h2 className={styles.cardTitle}>{giveaway.title}</h2>
          <a
            href={giveaway.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.postLink}
          >
            instagram.com/p/{giveaway.shortcode}
          </a>
        </div>
        <span className={`${styles.status} ${meta.className}`}>{meta.label}</span>
      </div>

      <dl className={styles.statRow}>
        <div className={styles.stat}>
          <dt>Ends</dt>
          <dd>{new Date(giveaway.endDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Rules</dt>
          <dd>{rulesSummary(giveaway)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Entrants</dt>
          <dd>
            {entrantCount === 0
              ? 'None imported'
              : `${eligibleCount} eligible of ${entrantCount} unique`}
          </dd>
        </div>
      </dl>

      {locked && giveaway.winners.length > 0 && (
        <div className={styles.winnerStrip}>
          <span className={styles.winnerStripLabel}>
            {giveaway.winners.length === 1 ? 'Winner' : 'Winners'}
          </span>
          <span className={styles.winnerStripNames}>
            {giveaway.winners.map(w => `@${w.username}`).join(', ')}
          </span>
        </div>
      )}

      <div className={styles.cardActions}>
        {!locked && (
          <button className="btn btn-ghost btn-sm" onClick={onEntrants}>
            {entrantCount === 0 ? 'Import entrants' : 'Entrants'}
          </button>
        )}
        {locked && (
          <a
            href={`/giveaways/${giveaway.shortcode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            Winners page
          </a>
        )}

        {canRoll && (
          <button className="btn btn-primary btn-sm" onClick={onRoll} disabled={eligibleCount === 0}>
            Start Roll
          </button>
        )}

        <span className={styles.actionSpacer} />

        {!locked && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={onEdit} title="Edit giveaway">⚙️</button>
            <button className="btn btn-danger btn-sm" onClick={onRemove} title="Remove giveaway">🗑️</button>
          </>
        )}
        {locked && <span className={styles.lockedNote}>Locked — result is final</span>}
      </div>

      {status === 'awaiting_roll' && !isSuperadmin && (
        <p className={styles.roleNote}>Only a superadmin can roll this giveaway.</p>
      )}
    </motion.div>
  );
}
