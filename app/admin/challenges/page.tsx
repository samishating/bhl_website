'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/animations';
import Modal from '@/components/Modal';


interface Challenge { _id: string; title: string; description: string; xpReward: number; division: string; active: boolean; allowRepeats: boolean; }
const divTagClass: Record<string, string> = { gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content', global: 'tag-global' };

const defaultForm = { title: '', description: '', xpReward: 50, division: 'gaming', allowRepeats: false };

const dotColors: Record<string, string> = { gaming: '#FFFDBA', music: '#A855F7', sport: '#06B6D4', content: '#EF4444' };

export default function AdminChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    fetch('/api/challenges')
      .then(r => r.json())
      .then(d => { setChallenges(d.challenges || []); setLoading(false); });
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId ? `/api/challenges/${editingId}` : '/api/challenges';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      setForm(defaultForm);
      setShowForm(false);
      setEditingId(null);
      load();
      showToast(editingId ? 'Mission parameters updated!' : 'New mission deployed!', 'success');
    } else {
      const d = await res.json();
      showToast(`${d.error || 'Failed'}`, 'error');
    }
  };

  const handleEdit = (c: Challenge) => {
    setEditingId(c._id);
    setForm({ title: c.title, description: c.description, xpReward: c.xpReward, division: c.division, allowRepeats: !!c.allowRepeats });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/challenges/${id}`, { method: 'DELETE' });
    load();
    showToast('Mission neutralized', 'info');
  };

  return (
    <>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Challenges</h1>
            <p className={styles.sub}>{challenges.length} active challenges available</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(defaultForm); setEditingId(null); setShowForm(true); }}>
            + Create Challenge
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '10rem' }}>
            <div className="loader-visual" style={{ margin: '0 auto' }}>
              <div className="loader-arc" />
              <img src="/brand/logo.webp" alt="" className="loader-logo" />
            </div>
            <p className="loader-text" style={{ marginTop: '2rem' }}>Scanning Challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No active challenges available</p>
          </div>
        ) : (
          <motion.div 
            className={styles.challengeGrid}
            variants={staggerContainer}
          >
            {challenges.map(c => (
              <motion.div 
                key={c._id} 
                className={styles.challengeCard}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.challengeTitle}>{c.title}</div>
                  <div className={styles.xpBadge}>+{c.xpReward} XP</div>
                </div>
                
                <div className={styles.challengeDesc}>{c.description}</div>

                <div className={styles.cardFooter}>
                  <div className={styles.divisionLabel} style={{ '--dot-color': dotColors[c.division] || '#fff' } as any}>
                    <span className={styles.divisionDot} />
                    {c.division} Division
                    {c.allowRepeats && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(Repeatable)</span>}
                  </div>
                  
                  <div className={styles.cardActions}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)} title="Edit Params">⚙️</button>
                    {user?.role === 'superadmin' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)} title="Purge Mission">🗑️</button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Challenge' : 'Create New Challenge'}
        footer={
          <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" form="challenge-form" className="btn btn-primary" disabled={creating} style={{ flex: 1 }}>
              {creating ? <span className="spinner" /> : editingId ? 'UPDATE CHALLENGE' : 'CREATE CHALLENGE'}
            </button>
          </div>
        }
      >
        <form id="challenge-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Challenge Title *</label>
            <input required className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Challenge title" />
          </div>

          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label">XP Reward</label>
              <input type="number" className="form-input" value={form.xpReward} onChange={e => setForm(p => ({ ...p, xpReward: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Division</label>
              <select className="form-input" value={form.division} onChange={e => setForm(p => ({ ...p, division: e.target.value }))}>
                {['gaming', 'music', 'sport', 'content'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Challenge Description *</label>
            <textarea required className="form-input" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide clear objectives..." style={{ resize: 'none' }} />
          </div>

          <div 
            className={styles.premiumToggle} 
            onClick={() => setForm(p => ({ ...p, allowRepeats: !p.allowRepeats }))}
            style={{ marginTop: '24px', marginBottom: 0 }}
          >
            <div className={styles.toggleBox}>
              {form.allowRepeats && <div className={styles.checkmark}>✓</div>}
            </div>
            <div className={styles.toggleContent}>
              <div className={styles.toggleLabel}>ALLOW MULTIPLE COMPLETIONS</div>
              <div className={styles.toggleSubtext}>Repeatable</div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
