'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Challenge { _id: string; title: string; description: string; xpReward: number; division: string; active: boolean; }
const divTagClass: Record<string, string> = { gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content', global: 'tag-global' };

const defaultForm = { title: '', description: '', xpReward: 50, division: 'global' };

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    fetch('/api/challenges?division=global')
      .then(r => r.json())
      .then(d => { setChallenges(d.challenges || []); setLoading(false); });
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      setForm(defaultForm);
      setShowForm(false);
      load();
      showToast('✅ Challenge created!');
    } else {
      const d = await res.json();
      showToast(`❌ ${d.error || 'Failed'}`);
    }
  };

  const handleDelete = async (id: string) => {
    // Removing confirmation alert per user request, using toast for feedback
    await fetch(`/api/challenges/${id}`, { method: 'DELETE' });
    load();
    showToast('🗑 Challenge deleted');
  };

  return (
    <div>
      {toast && <div className="toast">{toast}</div>}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Challenges</h1>
          <p className={styles.sub}>{challenges.length} active challenges</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} id="admin-create-challenge-btn">
          {showForm ? 'Cancel' : '+ New Challenge'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <h3 className={styles.formTitle}>Create Challenge</h3>
          <div className={styles.formRow}>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Title *</label>
              <input required className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Challenge title" id="challenge-title" />
            </div>
            <div className="form-group">
              <label className="form-label">XP Reward</label>
              <input type="number" className="form-input" value={form.xpReward} onChange={e => setForm(p => ({ ...p, xpReward: Number(e.target.value) }))} id="challenge-xp" />
            </div>
            <div className="form-group">
              <label className="form-label">Division</label>
              <select className="form-input" value={form.division} onChange={e => setForm(p => ({ ...p, division: e.target.value }))} id="challenge-division">
                {['global', 'gaming', 'music', 'sport', 'content'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea required className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what members need to do…" id="challenge-desc" style={{ resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating} id="challenge-submit-btn">
            {creating ? <span className="spinner" /> : 'Create Challenge'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : challenges.length === 0 ? (
        <div className={styles.empty}>No challenges yet. Create one above!</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Title</th><th>Division</th><th>XP</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {challenges.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{c.description.slice(0, 60)}…</div>
                  </td>
                  <td><span className={`division-tag ${divTagClass[c.division]}`}>{c.division}</span></td>
                  <td><span style={{ color: 'var(--neon-blue)', fontFamily: 'Rajdhani', fontWeight: 700 }}>+{c.xpReward} XP</span></td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)} id={`delete-challenge-${c._id}`}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
