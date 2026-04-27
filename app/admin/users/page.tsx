'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLevelTitle } from '@/lib/xp';
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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

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
      // 1. Update Username and Divisions
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
        showToast(`❌ Error updating user: ${data.error}`);
        return;
      }

      // 2. Update Role (using the dedicated role endpoint)
      if (editForm.role !== editingUser.role) {
        const roleRes = await fetch(`/api/admin/users/${editingUser._id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: editForm.role })
        });
        if (!roleRes.ok) {
          const data = await roleRes.json();
          showToast(`❌ Error updating role: ${data.error}`);
        }
      }

      // Refresh list
      const fetchRes = await fetch('/api/users');
      const fetchData = await fetchRes.json();
      setUsers(fetchData.users || []);
      setEditingUser(null);
      showToast('✅ User updated successfully!');
    } catch (err) {
      showToast('❌ Network error');
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
    <div>
      {toast && <div className="toast">{toast}</div>}
      <h1 className={styles.title}>User Management</h1>
      <p className={styles.sub}>{users.length} total members</p>

      <input
        className="form-input"
        style={{ maxWidth: '360px', marginBottom: '1.5rem' }}
        placeholder="Search by username or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        id="admin-users-search"
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>User</th><th>Email</th><th>Level / XP</th><th>Divisions</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="avatar" style={{ fontSize: '0.8rem' }}>
                        {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <a href={`/users/${u._id}`} style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }} className="hover-link">{u.username}</a>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getLevelTitle(u.level)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{u.email}</td>
                  <td>
                    <span className="badge badge-violet" style={{ marginRight: '0.4rem' }}>Lv.{u.level}</span>
                    <span style={{ color: 'var(--neon-blue)', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem' }}>{u.xp} XP</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {u.divisions.map(d => <span key={d} className={`division-tag ${divTagClass[d] || ''}`}>{d}</span>)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'superadmin' ? 'badge-red' : u.role === 'admin' ? 'badge-red' : 'badge-blue'}`} style={u.role === 'superadmin' ? { background: 'linear-gradient(90deg, #ff0055, #cc0000)' } : {}}>
                      {u.role === 'superadmin' ? 'SUPERADMIN' : u.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {currentUser?.role === 'superadmin' && u.role !== 'superadmin' && (
                      <button className="btn btn-xs btn-secondary" onClick={() => handleEdit(u)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit User: {editingUser.username}</h2>
              <button onClick={() => setEditingUser(null)} className={styles.closeBtn}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  className="form-input" 
                  value={editForm.username} 
                  onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select 
                  className="form-input" 
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">Member</option>
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
                      className={`btn btn-xs ${editForm.divisions.includes(div.id) ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => toggleDivision(div.id)}
                    >
                      {div.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
