'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

import { getLevelTitle } from '@/lib/xp';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import Modal from '@/components/Modal';
import styles from './page.module.css';

interface User {
  _id: string; username: string; email: string; avatar: string; xp: number; level: number;
  divisions: string[]; badges: string[]; role: string; isAdmin?: boolean; createdAt: string;
}

const divTagClass: Record<string, string> = { gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content' };

const DIVISION_OPTIONS = [
  { id: 'gaming', label: 'Gaming' },
  { id: 'music', label: 'Music' },
  { id: 'sport', label: 'Sport' },
  { id: 'content', label: 'Content' },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ username: '', role: '', divisions: [] as string[] });
  const { showToast } = useToast();

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => { 
        setUsers(d.users || []); 
        setLoading(false); 
      })
      .catch(err => {
        console.error('[AdminUsers] Fetch error:', err);
        setLoading(false);
      });
  }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      role: user.role,
      divisions: [...user.divisions]
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editForm.username,
          divisions: editForm.divisions
        })
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(`Error updating user: ${data.error}`, 'error');
        return;
      }

      if (editForm.role !== editingUser.role) {
        const roleRes = await fetch(`/api/admin/users/${editingUser._id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: editForm.role })
        });
        if (!roleRes.ok) {
          const data = await roleRes.json();
          showToast(`Error updating role: ${data.error}`, 'error');
        }
      }

      const fetchRes = await fetch('/api/users');
      const fetchData = await fetchRes.json();
      setUsers(fetchData.users || []);
      setEditingUser(null);
      showToast('Member configuration synchronized!', 'success');
    } catch (err) {
      showToast('Synchronization error', 'error');
    }
  };

  const toggleDivision = (divId: string) => {
    setEditForm(prev => ({
      ...prev,
      divisions: prev.divisions.includes(divId)
        ? prev.divisions.filter(d => d !== divId)
        : [...prev.divisions, divId]
    }));
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
            <h1 className={styles.title}>User Management</h1>
            <p className={styles.sub}>Manage and configure platform users and roles</p>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              className="form-input"
              style={{ width: '320px', minHeight: '46px' }}
              placeholder="Search personnel by intel..."
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
            <p className="loader-text" style={{ marginTop: '2rem' }}>Scanning users...</p>
          </div>
        ) : (
          <motion.div 
            className={styles.userGrid}
            variants={staggerContainer}
          >
            {filtered.map(u => (
              <motion.div 
                key={u._id} 
                className={styles.userCard}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
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
                      {u.role === 'superadmin' ? 'Superadmin' : u.role === 'admin' ? 'Admin' : 'User'}
                    </div>
                  </div>
                </div>

                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <div className={styles.statLabel}>User XP</div>
                    <div className={styles.statValue}>{u.xp.toLocaleString()} dh</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statLabel}>Joined</div>
                    <div className={styles.statValue}>{new Date(u.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className={styles.divisionsRow}>
                  {u.divisions.length > 0 ? u.divisions.map(d => (
                    <span key={d} className={`division-tag ${divTagClass[d] || ''}`}>{d}</span>
                  )) : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No Division Assigned</span>}
                </div>

                <div className={styles.cardActions}>
                  <a href={`/users/${u._id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>View Profile</a>
                  {u.role !== 'superadmin' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleEdit(u)} style={{ flex: 1 }}>Edit</button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

        )}
      </motion.div>


      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.username}`}
        footer={
          <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
            <button className="btn btn-ghost" onClick={() => setEditingUser(null)} style={{ flex: 1 }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit} style={{ flex: 1 }}>Save Changes</button>
          </div>
        }
      >
        <div className="form-group">
          <label className="form-label">Username</label>
          <input 
            className="form-input" 
            value={editForm.username} 
            onChange={e => setEditForm({ ...editForm, username: e.target.value })} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">User Role</label>
          <select 
            className="form-input" 
            value={editForm.role} 
            onChange={e => setEditForm({ ...editForm, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Divisions</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {DIVISION_OPTIONS.map(div => (
              <button
                key={div.id}
                type="button"
                className={`btn btn-sm ${editForm.divisions.includes(div.id) ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => toggleDivision(div.id)}
                style={{ flex: 1, minWidth: '100px' }}
              >
                {div.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}

