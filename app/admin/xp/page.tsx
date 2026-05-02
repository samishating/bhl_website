'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { calculateLevel, getLevelTitle } from '@/lib/xp';
import styles from './page.module.css';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  xp: number;
  level: number;
  role: string;
}

export default function AdminXPPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newXp, setNewXp] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('[AdminXP] Fetch error:', err);
      showToast('Failed to load personnel data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditXp = (user: User) => {
    setEditingUser(user);
    setNewXp(user.xp);
  };

  const handleSaveXp = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser._id}/xp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: newXp })
      });

      if (res.ok) {
        showToast(`XP synchronized for ${editingUser.username}`, 'success');
        setEditingUser(null);
        fetchUsers(); // Refresh list
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update XP', 'error');
      }
    } catch (err) {
      showToast('Network error during synchronization', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const previewLevel = calculateLevel(newXp);

  return (
    <div className="animate-fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>XP & Level Control</h1>
          <p className={styles.sub}>Administrative override for user experience and rank progression</p>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input
            className="form-input"
            style={{ width: '320px' }}
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '10rem' }}>
          <div className="loader-visual" style={{ margin: '0 auto' }}>
            <div className="loader-arc" />
            <img src="/brand/logo.webp" alt="" className="loader-logo" />
          </div>
          <p className="loader-text" style={{ marginTop: '2rem' }}>Fetching encrypted user data...</p>
        </div>
      ) : (
        <div className={styles.userGrid}>
          {filtered.map(u => (
            <div key={u._id} className={styles.userCard}>
              <div className={styles.userHeader}>
                <div className={styles.avatarWrapper}>
                  <div className={styles.avatar}>
                    {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0].toUpperCase()}
                  </div>
                  <div className={styles.levelBadge}>Lv.{u.level}</div>
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.username}>{u.username}</div>
                  <div className={styles.email}>{u.email}</div>
                  <div className={`${styles.roleBadge} ${styles[u.role] || styles.user}`}>
                    {u.role}
                  </div>
                </div>
              </div>

              <div className={styles.xpSection}>
                <div className={styles.xpLabel}>Current Status</div>
                <div className={styles.xpValueRow}>
                  <span className={styles.xpCurrent}>{u.xp.toLocaleString()}</span>
                  <span className={styles.xpUnit}>XP</span>
                  <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {getLevelTitle(u.level)}
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ width: '100%' }}
                  onClick={() => handleEditXp(u)}
                  disabled={u.role === 'superadmin' && currentUser?.role !== 'superadmin'}
                >
                  Adjust XP / Level
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !isSaving && setEditingUser(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className={styles.username} style={{ margin: 0 }}>Adjust XP: {editingUser.username}</h3>
              <button className="btn-close" onClick={() => !isSaving && setEditingUser(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className={styles.modalXpInfo}>
                <div>
                  <div className={styles.previewLabel}>Current XP</div>
                  <div className={styles.previewValue}>{editingUser.xp.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.previewLabel}>Preview Level</div>
                  <div className={`${styles.previewValue} ${newXp !== editingUser.xp ? styles.new : ''}`}>
                    Lv.{previewLevel}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target XP Value</label>
                <input 
                  type="number"
                  className="form-input" 
                  value={newXp} 
                  onChange={e => setNewXp(Number(e.target.value))}
                  disabled={isSaving}
                  min="0"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Rank: {getLevelTitle(previewLevel)}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditingUser(null)} disabled={isSaving} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveXp} disabled={isSaving} style={{ flex: 1 }}>
                {isSaving ? 'Synchronizing...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
