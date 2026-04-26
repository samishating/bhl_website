'use client';
import { useState, useEffect } from 'react';
import { getLevelTitle } from '@/lib/xp';
import styles from './page.module.css';

interface User {
  _id: string; username: string; email: string; xp: number; level: number;
  divisions: string[]; badges: string[]; isAdmin: boolean; createdAt: string;
}

const divTagClass: Record<string, string> = { gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); });
  }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
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
              <tr><th>User</th><th>Email</th><th>Level / XP</th><th>Divisions</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="avatar" style={{ fontSize: '0.8rem' }}>{u.username[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.username}</div>
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
                    <span className={`badge ${u.isAdmin ? 'badge-red' : 'badge-blue'}`}>
                      {u.isAdmin ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
