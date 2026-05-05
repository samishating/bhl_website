'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

import styles from '../users/page.module.css';

interface User {
  _id: string; username: string; email: string; avatar: string; xp: number; level: number;
  divisions: string[]; badges: string[]; role: string; isAdmin?: boolean; createdAt: string;
  isPublic?: boolean; isFeatured?: boolean; displayOrder?: number;
  featuredLinks?: { title: string; url: string }[];
}

const divTagClass: Record<string, string> = { gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content' };

export default function AdminMembersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ 
    isPublic: false, 
    isFeatured: false, 
    displayOrder: 0,
    featuredLinks: [] as { title: string; url: string }[]
  });
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    fetch('/api/users')
      .then(r => r.json())
      .then(d => { 
        setUsers(d.users || []); 
        setLoading(false); 
      })
      .catch(err => {
        console.error('[AdminMembers] Fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      isPublic: !!user.isPublic,
      isFeatured: !!user.isFeatured,
      displayOrder: user.displayOrder || 0,
      featuredLinks: [...(user.featuredLinks || [])]
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: editForm.isPublic,
          isFeatured: editForm.isFeatured,
          displayOrder: editForm.displayOrder,
          featuredLinks: editForm.featuredLinks
        })
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(`Error updating user: ${data.error}`, 'error');
        return;
      }

      setUsers(current => current.map(u => u._id === editingUser._id ? { ...u, ...editForm } : u));
      setEditingUser(null);
      showToast('Community visibility updated!', 'success');
    } catch (err) {
      showToast('Synchronization error', 'error');
    }
  };

  const quickTogglePublic = async (userId: string, currentVal: boolean) => {
    try {
      setUsers(current => current.map(u => u._id === userId ? { ...u, isPublic: !currentVal } : u));
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !currentVal })
      });
      showToast(`User ${!currentVal ? 'made public' : 'hidden'}`, 'success');
    } catch {
      showToast('Toggle failed', 'error');
      load(); // Reload to fix state
    }
  };

  return (
    <>
      <div className="animate-fade-up">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Community Members</h1>
            <p className={styles.sub}>Manage public visibility and featured creators for the Community Hub</p>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              className="form-input"
              style={{ width: '320px', minHeight: '46px' }}
              placeholder="Search members..."
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
            <p className="loader-text" style={{ marginTop: '2rem' }}>Scanning members...</p>
          </div>
        ) : (
          <div className={styles.userGrid}>
            {filtered.map(u => (
              <div key={u._id} className={styles.userCard} style={{ border: u.isFeatured ? '1px solid var(--brand-red)' : undefined }}>
                <div className={styles.userHeader}>
                  <div className={styles.avatarWrapper}>
                    <div className={styles.avatar}>
                      {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0].toUpperCase()}
                    </div>
                    <div className={styles.levelBadge}>Lv.{u.level}</div>
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.username}>
                      {u.username}
                      {u.isFeatured && <span style={{ marginLeft: '0.4rem', color: 'var(--brand-red)', fontSize: '0.8rem' }}>★</span>}
                    </div>
                    <div className={styles.email}>{u.email}</div>
                    <div className={`${styles.roleBadge} ${u.isPublic ? styles.superadmin : styles.user}`} style={u.isPublic ? { background: 'rgba(0,255,100,0.1)', color: '#0f0', border: '1px solid rgba(0,255,100,0.3)' } : {}}>
                      {u.isPublic ? 'PUBLIC' : 'PRIVATE'}
                    </div>
                  </div>
                </div>

                <div className={styles.divisionsRow}>
                  {u.divisions.length > 0 ? u.divisions.map(d => (
                    <span key={d} className={`division-tag ${divTagClass[d] || ''}`}>{d}</span>
                  )) : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No Division Assigned</span>}
                </div>

                <div className={styles.cardActions}>
                  <button className={`btn btn-sm ${u.isPublic ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => quickTogglePublic(u._id, !!u.isPublic)} style={{ flex: 1 }}>
                    {u.isPublic ? 'Hide' : 'Make Public'}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(u)} style={{ flex: 1 }}>Configure</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingUser && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingUser(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className={styles.username} style={{ margin: 0 }}>Configure: {editingUser.username}</h3>
              <button className="btn-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '0.2rem' }}>Public Visibility</label>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Show this user on the Community Hub</div>
                </div>
                <input type="checkbox" checked={editForm.isPublic} onChange={e => setEditForm({...editForm, isPublic: e.target.checked})} style={{ width: '24px', height: '24px', accentColor: 'var(--brand-red)' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '0.2rem' }}>Featured Creator</label>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highlight user in the Featured Creators block</div>
                </div>
                <input type="checkbox" checked={editForm.isFeatured} onChange={e => setEditForm({...editForm, isFeatured: e.target.checked})} style={{ width: '24px', height: '24px', accentColor: 'var(--brand-red)' }} />
              </div>

              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input 
                  type="number"
                  className="form-input" 
                  value={editForm.displayOrder} 
                  onChange={e => setEditForm({ ...editForm, displayOrder: parseInt(e.target.value) || 0 })} 
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Higher numbers appear first.</div>
              </div>

              <div className="form-group" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Featured Content (YouTube/Media)</label>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditForm({ ...editForm, featuredLinks: [...editForm.featuredLinks, { title: '', url: '' }] })}>
                    + Add Link
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {editForm.featuredLinks.map((link, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <input 
                          className="form-input" 
                          style={{ minHeight: '36px', fontSize: '0.85rem' }}
                          placeholder="Content Title (e.g. My Latest Montage)" 
                          value={link.title}
                          onChange={e => {
                            const newLinks = [...editForm.featuredLinks];
                            newLinks[idx].title = e.target.value;
                            setEditForm({ ...editForm, featuredLinks: newLinks });
                          }}
                        />
                        <input 
                          className="form-input" 
                          style={{ minHeight: '36px', fontSize: '0.85rem' }}
                          placeholder="YouTube or Image URL" 
                          value={link.url}
                          onChange={e => {
                            const newLinks = [...editForm.featuredLinks];
                            newLinks[idx].url = e.target.value;
                            setEditForm({ ...editForm, featuredLinks: newLinks });
                          }}
                        />
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditForm({ ...editForm, featuredLinks: editForm.featuredLinks.filter((_, i) => i !== idx) })} style={{ color: 'var(--brand-red)' }}>✕</button>
                    </div>
                  ))}
                  {editForm.featuredLinks.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                      No featured content added yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditingUser(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} style={{ flex: 1 }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
