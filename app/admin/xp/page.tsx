'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import styles from './page.module.css';

interface ProgressionLevel {
  level: number;
  title: string;
  xpRequired: number;
}

/**
 * Accepts an array of { title, xpRequired } (level is optional and ignored --
 * calculateLevel() walks the thresholds array assuming ascending order, so
 * levels are always reassigned 1..N by sorted xpRequired rather than trusting
 * whatever order/level numbers the file happened to contain).
 */
function normalizeProgressionImport(data: unknown): ProgressionLevel[] | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const rows: { title: string; xpRequired: number }[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') return null;
    const rawTitle = (item as Record<string, unknown>).title;
    const rawXp = (item as Record<string, unknown>).xpRequired;
    const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
    const xpRequired = Number(rawXp);
    if (!title || !Number.isFinite(xpRequired) || xpRequired < 0) return null;
    rows.push({ title, xpRequired });
  }
  rows.sort((a, b) => a.xpRequired - b.xpRequired);
  return rows.map((r, i) => ({ level: i + 1, title: r.title, xpRequired: r.xpRequired }));
}

export default function AdminLevelSystemPage() {
  const { showToast } = useToast();

  const [progression, setProgression] = useState<ProgressionLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempData, setTempData] = useState<ProgressionLevel | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    fetch('/api/progression', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setProgression(d.progression || []))
      .catch((err) => {
        console.error('[AdminXP] Fetch error:', err);
        showToast('Critical synchronization failure', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('stats-refresh', loadData);
    return () => window.removeEventListener('stats-refresh', loadData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddLevel = () => {
    const nextLevel = progression.length + 1;
    const lastXp = progression.length > 0 ? progression[progression.length - 1].xpRequired : 0;
    const newLevel = {
      level: nextLevel,
      title: `Rank ${nextLevel}`,
      xpRequired: lastXp + 500
    };
    setProgression([...progression, newLevel]);
    setEditingIndex(progression.length);
    setTempData(newLevel);
  };

  const handleRemoveLevel = (index: number) => {
    if (progression.length <= 1) return;
    const updated = progression.filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, level: i + 1 }));
    setProgression(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setTempData(null);
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset immediately so re-selecting the same file re-fires onChange
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const normalized = normalizeProgressionImport(parsed);
        if (!normalized) {
          showToast('Invalid format — expected a JSON array of { title, xpRequired }', 'error');
          return;
        }
        setProgression(normalized);
        setEditingIndex(null);
        setTempData(null);
        showToast(`Loaded ${normalized.length} ranks from file — click Deploy System to save`, 'success');
      } catch {
        showToast('Could not parse that file as JSON', 'error');
      }
    };
    reader.onerror = () => showToast('Failed to read file', 'error');
    reader.readAsText(file);
  };

  const handleExportProgression = () => {
    const blob = new Blob([JSON.stringify(progression, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bhl-level-progression.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setTempData({ ...progression[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setTempData(null);
  };

  const saveRow = (index: number) => {
    if (!tempData) return;
    const updated = [...progression];
    updated[index] = tempData;
    setProgression(updated);
    setEditingIndex(null);
    setTempData(null);
  };

  const handleSaveSystem = async () => {
    setIsSavingSystem(true);
    try {
      const res = await fetch('/api/admin/progression', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progression })
      });

      if (res.ok) {
        showToast('Progression system updated globally', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update progression', 'error');
      }
    } catch (err) {
      showToast('Network error during save', 'error');
    } finally {
      setIsSavingSystem(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem' }}>
        <div className="loader-visual" style={{ margin: '0 auto' }}>
          <div className="loader-arc" />
          <img src="/brand/logo.png" alt="" className="loader-logo" />
        </div>
        <p className="loader-text" style={{ marginTop: '2rem' }}>Decrypting progression nodes...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Progression Sector</h1>
          <p className={styles.sub}>Manage global level architecture and member experience</p>
        </div>
      </div>

      <div className={styles.systemView}>
        <div className={styles.systemHeader}>
          <div>
            <h3>Global Rank Architecture</h3>
            <p>Define levels, titles, and XP thresholds for the entire platform.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
            <button className="btn btn-ghost btn-sm" onClick={handleExportProgression} disabled={progression.length === 0}>
              Export JSON
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleImportClick}>Import JSON</button>
            <button className="btn btn-ghost btn-sm" onClick={handleAddLevel}>+ Add Rank</button>
            <button className="btn btn-primary btn-sm" onClick={handleSaveSystem} disabled={isSavingSystem}>
              {isSavingSystem ? 'Saving...' : 'Deploy System'}
            </button>
          </div>
        </div>

        <div className={styles.levelTable}>
          <div className={styles.levelTableHeader}>
            <div className={styles.colLvl}>LVL</div>
            <div className={styles.colTitle}>RANK TITLE</div>
            <div className={styles.colXp}>XP REQUIRED</div>
            <div className={styles.colActions}>ACTIONS</div>
          </div>
          {progression.map((p, i) => (
            <div key={i} className={`${styles.levelTableRow} ${editingIndex === i ? styles.isEditing : ''}`}>
              <div className={styles.colLvl}>
                <span className={styles.lvlAnchor}>{p.level}</span>
                {i < progression.length - 1 && <div className={styles.ladderLine} />}
              </div>

              <div className={styles.colTitle}>
                {editingIndex === i ? (
                  <input
                    className={styles.inlineInput}
                    value={tempData?.title || ''}
                    onChange={e => setTempData(prev => prev ? { ...prev, title: e.target.value } : null)}
                    autoFocus
                  />
                ) : (
                  <span className={styles.rankTitleText}>{p.title}</span>
                )}
              </div>

              <div className={styles.colXp}>
                {editingIndex === i ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      className={styles.inlineInput}
                      value={tempData?.xpRequired || 0}
                      onChange={e => setTempData(prev => prev ? { ...prev, xpRequired: Number(e.target.value) } : null)}
                    />
                    <span className={styles.xpSmallUnit}>XP</span>
                  </div>
                ) : (
                  <div className={styles.xpDisplay}>
                    <span className={styles.xpText}>{p.xpRequired.toLocaleString()}</span>
                    <span className={styles.xpSmallUnit}>XP</span>
                  </div>
                )}
              </div>

              <div className={styles.colActions}>
                <div className={styles.actionReveal}>
                  {editingIndex === i ? (
                    <>
                      <button className={styles.iconBtn} onClick={() => saveRow(i)} title="Save Rank">✓</button>
                      <button className={styles.iconBtn} onClick={cancelEditing} title="Cancel">✕</button>
                    </>
                  ) : (
                    <>
                      <button className={styles.iconBtn} onClick={() => startEditing(i)} title="Edit Rank">✎</button>
                      <button className={`${styles.iconBtn} ${styles.btnDestructive}`} onClick={() => handleRemoveLevel(i)} title="Delete Rank">🗑</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
