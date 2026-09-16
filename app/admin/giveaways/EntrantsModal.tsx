'use client';
import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { evaluateEntrant, RULE_LABELS, type RuleCheck, type GiveawayRule } from '@/lib/giveaways';
import type { AdminGiveaway } from './page';
import styles from './page.module.css';

const CHECK_META: Record<RuleCheck, { symbol: string; className: string; title: string }> = {
  pass: { symbol: '✓', className: styles.checkPass, title: 'Verified — passed' },
  fail: { symbol: '✕', className: styles.checkFail, title: 'Verified — failed' },
  unverified: { symbol: '?', className: styles.checkUnknown, title: 'Not captured — self-reported, trusted' },
};

interface Props {
  giveaway: AdminGiveaway;
  isSuperadmin: boolean;
  onClose: () => void;
  onChanged: (updated: AdminGiveaway) => void;
}

export default function EntrantsModal({ giveaway, isSuperadmin, onClose, onChanged }: Props) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'review' | 'import'>(giveaway.entrants?.length ? 'review' : 'import');
  const [raw, setRaw] = useState('');
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busyHandle, setBusyHandle] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const evaluated = useMemo(
    () =>
      (giveaway.entrants || [])
        .map(entrant => ({ entrant, result: evaluateEntrant(entrant, giveaway) }))
        // Ineligible first so problems are the first thing a superadmin sees.
        .sort((a, b) => Number(a.result.eligible) - Number(b.result.eligible)),
    [giveaway]
  );

  const eligibleCount = evaluated.filter(e => e.result.eligible).length;
  const shortfall = giveaway.winnerCount - eligibleCount;

  const submitImport = async (text: string) => {
    if (!text.trim()) {
      showToast('Paste a capture first', 'error');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      showToast('That is not valid JSON', 'error');
      return;
    }

    setImporting(true);
    const res = await fetch(`/api/giveaways/${giveaway._id}/entrants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    const data = await res.json().catch(() => ({}));
    setImporting(false);

    if (res.ok) {
      showToast(
        `Imported ${data.imported.unique} unique entrants (${data.imported.eligible} eligible)`,
        'success'
      );
      setRaw('');
      setTab('review');
      onChanged(data.giveaway);
    } else {
      showToast(data.error || 'Import failed', 'error');
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setRaw(text);
    submitImport(text);
  };

  const toggleDisqualify = async (username: string, disqualified: boolean) => {
    setBusyHandle(username);
    const res = await fetch(`/api/giveaways/${giveaway._id}/entrants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, disqualified }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyHandle(null);

    if (res.ok) {
      showToast(disqualified ? `@${username} disqualified` : `@${username} reinstated`, 'info');
      onChanged(data.giveaway);
    } else {
      showToast(data.error || 'Could not update entrant', 'error');
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Entrants — ${giveaway.title}`} maxWidth="800px">
      <div className={styles.tabRow}>
        <div className="selection-pill-group">
          {(['review', 'import'] as const).map(key => (
            <button
              key={key}
              className={`selection-pill selection-pill-compact ${tab === key ? 'selection-pill-active' : ''}`}
              onClick={() => setTab(key)}
            >
              {tab === key && (
                <motion.span
                  layoutId="entrants-tab-indicator"
                  className="selection-pill-indicator"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <span className="selection-pill-label">
                {key === 'review' ? `Review (${giveaway.entrants?.length || 0})` : 'Import'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'import' ? (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.captureHint}>
              <p className={styles.captureHintBody}>
                Run the BHL giveaway extractor userscript on this post while logged into Instagram,
                then paste or drop the JSON it produces.
              </p>
              <dl className={styles.captureFacts}>
                <div>
                  <dt>Shortcode</dt>
                  <dd><code>{giveaway.shortcode}</code></dd>
                </div>
                {giveaway.mediaId && (
                  <div>
                    <dt>Media ID</dt>
                    <dd><code>{giveaway.mediaId}</code></dd>
                  </div>
                )}
              </dl>
            </div>

            <div
              className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
            >
              <span className={styles.dropZoneLabel}>
                {dragging ? 'Drop the capture file' : 'Drop a .json capture here, or click to browse'}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="form-label" htmlFor="capture-json">Or paste the capture JSON</label>
              <textarea
                id="capture-json"
                className="form-input"
                value={raw}
                onChange={e => setRaw(e.target.value)}
                placeholder={'{ "version": 1, "postUrl": "...", "entrants": [ ... ] }'}
                style={{ minHeight: '130px', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={() => submitImport(raw)}
              disabled={importing}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {importing ? <span className="spinner" /> : 'IMPORT ENTRANTS'}
            </button>

            {giveaway.entrants?.length > 0 && (
              <p className={styles.replaceWarning}>
                This replaces the current snapshot of {giveaway.entrants.length} entrants.
                Manual disqualifications are carried over by username.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {evaluated.length === 0 ? (
              <p className={styles.reviewEmpty}>No entrants imported yet.</p>
            ) : (
              <>
                <div className={styles.reviewSummary}>
                  <div className={styles.reviewStat}>
                    <span className={styles.reviewStatValue}>{evaluated.length}</span>
                    <span className={styles.reviewStatLabel}>Unique</span>
                  </div>
                  <div className={styles.reviewStat}>
                    <span className={styles.reviewStatValue}>{eligibleCount}</span>
                    <span className={styles.reviewStatLabel}>Eligible</span>
                  </div>
                  <div className={styles.reviewStat}>
                    <span className={styles.reviewStatValue}>{giveaway.winnerCount}</span>
                    <span className={styles.reviewStatLabel}>Winners</span>
                  </div>
                </div>

                {shortfall > 0 && (
                  <p className={styles.shortfallWarning}>
                    {eligibleCount} eligible but {giveaway.winnerCount} winners configured — the roll will
                    be blocked until you lower the winner count or relax the rules.
                  </p>
                )}

                <ul className={styles.entrantList}>
                  {evaluated.map(({ entrant, result }) => (
                    <li
                      key={entrant.username}
                      className={`${styles.entrantRow} ${result.eligible ? '' : styles.entrantRowOut}`}
                    >
                      <a
                        href={entrant.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.entrantHandle}
                      >
                        @{entrant.username}
                      </a>

                      <span className={styles.entrantChecks}>
                        {entrant.disqualified && (
                          <span className={styles.disqualifiedTag}>
                            Disqualified{entrant.disqualifiedReason ? ` — ${entrant.disqualifiedReason}` : ''}
                          </span>
                        )}
                        {(giveaway.rules || []).map((rule: GiveawayRule) => {
                          const check = result.checks[rule];
                          if (!check) return null;
                          const meta = CHECK_META[check];
                          return (
                            <span
                              key={rule}
                              className={`${styles.check} ${meta.className}`}
                              title={`${RULE_LABELS[rule]} — ${meta.title}`}
                            >
                              {meta.symbol} {RULE_LABELS[rule].replace('Must ', '')}
                            </span>
                          );
                        })}
                        {entrant.commentCount > 1 && (
                          <span className={styles.entrantMeta}>{entrant.commentCount} comments</span>
                        )}
                      </span>

                      {isSuperadmin ? (
                        <button
                          className={`btn btn-sm ${entrant.disqualified ? 'btn-ghost' : 'btn-danger'}`}
                          onClick={() => toggleDisqualify(entrant.username, !entrant.disqualified)}
                          disabled={busyHandle === entrant.username}
                        >
                          {busyHandle === entrant.username
                            ? '...'
                            : entrant.disqualified ? 'Reinstate' : 'Disqualify'}
                        </button>
                      ) : (
                        <span className={styles.entrantMeta}>
                          {entrant.disqualified ? 'Disqualified' : result.eligible ? '' : result.reason}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <p className={styles.legend}>
                  <span className={styles.checkPass}>✓</span> machine-verified ·{' '}
                  <span className={styles.checkFail}>✕</span> verified fail ·{' '}
                  <span className={styles.checkUnknown}>?</span> not captured, trusted
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
