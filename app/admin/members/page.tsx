'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';
import { 
  FaYoutube, FaTwitch, FaInstagram, FaTiktok, FaSpotify, 
  FaApple, FaSoundcloud, FaDiscord, FaGlobe 
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

interface User {
  _id: string; username: string; email: string; avatar: string; xp: number; level: number;
  divisions: string[]; badges: string[]; role: string; isAdmin?: boolean; createdAt: string;
  isPublic?: boolean; isFeatured?: boolean; displayOrder?: number;
  socialLinks?: Record<string, string>;
  featuredLinks?: { title: string; url: string; type?: string; thumbnail?: string }[];
}

const ToggleSwitch = ({ checked, onChange, label, sublabel }: { checked: boolean; onChange: (v: boolean) => void; label: string; sublabel: string }) => (
  <div className={styles.toggleRow} onClick={() => onChange(!checked)}>
    <div className={styles.toggleText}>
      <div className={styles.toggleLabel}>{label}</div>
      <div className={styles.toggleSublabel}>{sublabel}</div>
    </div>
    <div className={`${styles.switch} ${checked ? styles.switchOn : ''}`}>
      <div className={styles.switchHandle} />
    </div>
  </div>
);

const PLATFORM_ICONS: Record<string, any> = {
  twitter: <FaXTwitter />, youtube: <FaYoutube />, twitch: <FaTwitch />, instagram: <FaInstagram />,
  tiktok: <FaTiktok />, spotify: <FaSpotify />, appleMusic: <FaApple />, soundcloud: <FaSoundcloud />,
  kick: <span style={{ fontWeight: 900 }}>K</span>, discord: <FaDiscord />, website: <FaGlobe />,
};

export default function AdminMembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ 
    isPublic: false, 
    isFeatured: false, 
    displayOrder: 0,
    featuredLinks: [] as { title: string; url: string; type: string; thumbnail: string }[]
  });
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    fetch('/api/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); });
  };
  useEffect(load, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editingUser) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [editingUser]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      isPublic: !!user.isPublic,
      isFeatured: !!user.isFeatured,
      displayOrder: user.displayOrder || 0,
      featuredLinks: (user.featuredLinks || []).map(l => ({
        title: l.title || '',
        url: l.url || '',
        type: l.type || 'youtube',
        thumbnail: l.thumbnail || ''
      }))
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        showToast('Member configuration updated', 'success');
        setEditingUser(null);
        load();
      } else {
        showToast('Failed to update member', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  const filtered = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Members Management</h1>
          <p className={styles.sub}>Manage public visibility and creator status</p>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input 
            className="form-input" 
            placeholder="Search username or email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '300px' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}><span className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Status</th>
                <th>Socials</th>
                <th>Community</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="avatar avatar-sm">
                        {u.avatar ? <img src={u.avatar} alt="" /> : u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lv.{u.level} • {u.xp} XP</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {u.role === 'superadmin' && <span className="badge badge-red" style={{ scale: '0.8' }}>Super</span>}
                      {u.role === 'admin' && <span className="badge badge-red" style={{ scale: '0.8' }}>Admin</span>}
                      {u.divisions.map(d => <span key={d} className={`division-tag tag-${d}`} style={{ scale: '0.7', margin: 0 }}>{d}</span>)}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {Object.keys(u.socialLinks || {}).filter(k => u.socialLinks?.[k]).slice(0, 4).map(k => (
                        <span key={k} style={{ color: 'var(--brand-red)', fontSize: '0.8rem' }}>{PLATFORM_ICONS[k] || k[0].toUpperCase()}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {u.isPublic && <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 800 }}>PUBLIC</span>}
                      {u.isFeatured && <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 800 }}>FEATURED</span>}
                      {!u.isPublic && !u.isFeatured && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PRIVATE</span>}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(u)}>Configure</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingUser(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'Rajdhani', fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
                Configure Creator: {editingUser.username}
              </h3>
              <button className="btn-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <ToggleSwitch 
                  checked={editForm.isPublic} 
                  onChange={v => setEditForm({ ...editForm, isPublic: v })}
                  label="Public Visibility"
                  sublabel="Show this member in the community directory"
                />

                <ToggleSwitch 
                  checked={editForm.isFeatured} 
                  onChange={v => setEditForm({ ...editForm, isFeatured: v })}
                  label="Featured Creator"
                  sublabel="Highlight in the featured section and hub hero"
                />

                <div className="form-group">
                  <label className="form-label">Display Order Priority</label>
                  <input 
                    type="number"
                    className="form-input" 
                    value={editForm.displayOrder} 
                    onChange={e => setEditForm({ ...editForm, displayOrder: parseInt(e.target.value) || 0 })} 
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Higher numbers appear first.</div>
                </div>

                <div className={styles.featuredSection}>
                  <div className={styles.featuredHeader}>
                    <label className="form-label" style={{ margin: 0 }}>Featured Media</label>
                    <button className="btn btn-primary btn-sm" onClick={() => setEditForm({ ...editForm, featuredLinks: [...editForm.featuredLinks, { title: '', url: '', type: 'youtube', thumbnail: '' }] })}>
                      + Add Content
                    </button>
                  </div>
                  
                  <div className={styles.mediaCardsList}>
                    {editForm.featuredLinks.map((link, idx) => (
                      <div key={idx} className={styles.mediaAdminCard}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <input 
                              className="form-input" 
                              style={{ marginBottom: '8px' }}
                              placeholder="Title" 
                              value={link.title}
                              onChange={e => {
                                const nl = [...editForm.featuredLinks];
                                nl[idx].title = e.target.value;
                                setEditForm({ ...editForm, featuredLinks: nl });
                              }}
                            />
                            <input 
                              className="form-input" 
                              style={{ marginBottom: '8px' }}
                              placeholder="URL" 
                              value={link.url}
                              onChange={e => {
                                const nl = [...editForm.featuredLinks];
                                nl[idx].url = e.target.value;
                                setEditForm({ ...editForm, featuredLinks: nl });
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <select 
                                className="form-input"
                                style={{ width: '120px' }}
                                value={link.type}
                                onChange={e => {
                                  const nl = [...editForm.featuredLinks];
                                  nl[idx].type = e.target.value;
                                  setEditForm({ ...editForm, featuredLinks: nl });
                                }}
                              >
                                <option value="youtube">YouTube</option>
                                <option value="spotify">Spotify</option>
                                <option value="apple">Apple</option>
                                <option value="soundcloud">SoundCloud</option>
                                <option value="other">Other</option>
                              </select>
                              <input 
                                className="form-input" 
                                placeholder="Thumb URL (optional)" 
                                value={link.thumbnail}
                                onChange={e => {
                                  const nl = [...editForm.featuredLinks];
                                  nl[idx].thumbnail = e.target.value;
                                  setEditForm({ ...editForm, featuredLinks: nl });
                                }}
                              />
                            </div>
                          </div>
                          <button className="btn btn-ghost" onClick={() => setEditForm({ ...editForm, featuredLinks: editForm.featuredLinks.filter((_, i) => i !== idx) })} style={{ height: 'fit-content', color: 'var(--brand-red)' }}>✕</button>
                        </div>
                      </div>
                    ))}
                    {editForm.featuredLinks.length === 0 && (
                      <div className={styles.mediaEmpty}>No featured content added.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
