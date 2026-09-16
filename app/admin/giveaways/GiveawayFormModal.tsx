'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import { extractShortcode, MAX_REQUIRED_TAGS } from '@/lib/giveaways';
import type { AdminGiveaway } from './page';
import styles from './page.module.css';

/** `datetime-local` needs a local-time string, not an ISO/UTC one. */
function toLocalInput(value?: string): string {
  const date = value ? new Date(value) : new Date(Date.now() + 7 * 86_400_000);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

type EntryMode = 'comment' | 'tags';

const ENTRY_MODES: { key: EntryMode; label: string }[] = [
  { key: 'comment', label: 'Any comment' },
  { key: 'tags', label: 'Must tag friends' },
];

interface Props {
  /** null = creating a new giveaway. */
  giveaway: AdminGiveaway | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function GiveawayFormModal({ giveaway, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const { shouldReduce } = useMotionConfig();
  const editing = !!giveaway;

  const [title, setTitle] = useState(giveaway?.title || '');
  const [postUrl, setPostUrl] = useState(giveaway?.postUrl || '');
  const [endDate, setEndDate] = useState(toLocalInput(giveaway?.endDate));
  const [winnerCount, setWinnerCount] = useState(giveaway?.winnerCount || 1);
  const [entryMode, setEntryMode] = useState<EntryMode>((giveaway?.minTags ?? 0) > 0 ? 'tags' : 'comment');
  // Remembered separately so flipping to "Any comment" and back doesn't lose the number.
  const [tagCount, setTagCount] = useState(Math.max(1, giveaway?.minTags ?? 1));
  const [saving, setSaving] = useState(false);

  const shortcode = extractShortcode(postUrl);
  const urlInvalid = postUrl.trim().length > 0 && !shortcode;
  const minTags = entryMode === 'tags' ? tagCount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInvalid) {
      showToast('That does not look like an Instagram post link', 'error');
      return;
    }

    setSaving(true);
    const res = await fetch(editing ? `/api/giveaways/${giveaway._id}` : '/api/giveaways', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        postUrl,
        endDate: new Date(endDate).toISOString(),
        winnerCount,
        minTags,
      }),
    });
    setSaving(false);

    if (res.ok) {
      showToast(editing ? 'Giveaway updated' : 'Giveaway published to the feed', 'success');
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'Could not save giveaway', 'error');
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Giveaway' : 'Add Giveaway'}
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button type="submit" form="giveaway-form" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
            {saving ? <span className="spinner" /> : editing ? 'SAVE CHANGES' : 'ADD GIVEAWAY'}
          </button>
        </div>
      }
    >
      <form id="giveaway-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="giveaway-title">Giveaway Title *</label>
          <input
            id="giveaway-title"
            required
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. BHL Hoodie Drop Giveaway"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="giveaway-url">Instagram Post Link *</label>
          <input
            id="giveaway-url"
            required
            className="form-input"
            value={postUrl}
            onChange={e => setPostUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/XXXXXXXXXXX/"
            style={urlInvalid ? { borderColor: 'var(--brand-red)' } : undefined}
          />
          <p className={styles.fieldHint}>
            {urlInvalid
              ? 'Paste a full /p/, /reel/ or /tv/ permalink.'
              : shortcode
                ? `Post ${shortcode} — this also becomes the winners page address.`
                : 'The post is embedded natively on the public feed.'}
          </p>
        </div>

        <div className={styles.formRow}>
          <div className="form-group">
            <label className="form-label" htmlFor="giveaway-end">Entries Close *</label>
            <input
              id="giveaway-end"
              required
              type="datetime-local"
              className="form-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="giveaway-winners">Number of Winners *</label>
            <input
              id="giveaway-winners"
              required
              type="number"
              min={1}
              className="form-input"
              value={winnerCount}
              onChange={e => setWinnerCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">To Enter</label>
          <div className="selection-pill-group" role="radiogroup" aria-label="Entry requirement">
            {ENTRY_MODES.map(mode => (
              <button
                key={mode.key}
                type="button"
                role="radio"
                aria-checked={entryMode === mode.key}
                className={`selection-pill selection-pill-compact ${entryMode === mode.key ? 'selection-pill-active' : ''}`}
                onClick={() => setEntryMode(mode.key)}
              >
                {entryMode === mode.key && (
                  <motion.span
                    layoutId="giveaway-entry-mode"
                    className="selection-pill-indicator"
                    transition={shouldReduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="selection-pill-label">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {entryMode === 'tags' && (
            <motion.div
              key="tag-count"
              className="form-group"
              initial={shouldReduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={shouldReduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <label className="form-label" htmlFor="giveaway-tags">Friends to Tag *</label>
              <input
                id="giveaway-tags"
                required
                type="number"
                min={1}
                max={MAX_REQUIRED_TAGS}
                className="form-input"
                value={tagCount}
                onChange={e => setTagCount(Math.min(MAX_REQUIRED_TAGS, Math.max(1, Number(e.target.value) || 1)))}
              />
              <p className={styles.fieldHint}>
                Tags add up across all of someone&apos;s comments. The same friend counts once, and
                tagging yourself or the giveaway account doesn&apos;t count.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className={styles.fieldHint}>
          {entryMode === 'tags'
            ? `Every unique commenter who tagged at least ${tagCount} friend${tagCount === 1 ? '' : 's'} is entered.`
            : 'Every unique commenter is entered — repeat comments count once.'}{' '}
          You check the drawn winners yourself before publishing and redraw anyone who doesn&apos;t qualify.
        </p>
      </form>
    </Modal>
  );
}
