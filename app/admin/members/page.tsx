export const dynamic = 'force-dynamic';
'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';
import { 
  FaYoutube, FaTwitch, FaInstagram, FaTiktok, FaSpotify, 
  FaApple, FaSoundcloud, FaDiscord, FaGlobe, FaSync
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import Modal from '@/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';

interface User {
  _id: string; username: string; email: string; avatar: string; xp: number; level: number;
  divisions: string[]; badges: string[]; role: string; createdAt: string;
  isPublic?: boolean; isFeatured?: boolean; displayOrder?: number;
  socialLinks?: Record<string, string>;
  featuredLinks?: { title: string; url: string; type?: string; thumbnail?: string }[];
  youtubeChannelId?: string;
  youtubeUploadsPlaylistId?: string;
  youtubeHandle?: string;
  youtubeLastSynced?: string;
  creatorDisplayName?: string;
}

interface CachedVideo {
  _id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  isFeatured: boolean;
  isHidden: boolean;
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
    featuredLinks: [] as { title: string; url: string; type: string; thumbnail: string }[],
    youtubeChannelId: '',
    youtubeHandle: '',
    youtubeUrl: '',
    creatorDisplayName: '',
  });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ videosFetched: number; error?: string } | null>(null);
  const [cachedVideos, setCachedVideos] = useState<CachedVideo[]>([]);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    fetch('/api/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); });
  };
  useEffect(load, []);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setSyncResult(null);
    setEditForm({
      isPublic: !!user.isPublic,
      isFeatured: !!user.isFeatured,
      featuredLinks: (user.featuredLinks || []).map(l => ({
        title: l.title || '', url: l.url || '', type: l.type || 'youtube', thumbnail: l.thumbnail || ''
      })),
      youtubeChannelId: user.youtubeChannelId || '',
      youtubeHandle: user.youtubeHandle || '',
      youtubeUrl: user.socialLinks?.youtube || '',
      creatorDisplayName: user.creatorDisplayName || '',
    });
    fetch(`/api/admin/youtube/videos/${user._id}`)
      .then(r => r.json())
      .then(d => setCachedVideos(Array.isArray(d) ? d : []))
      .catch(() => setCachedVideos([]));
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: editForm.isPublic,
          isFeatured: editForm.isFeatured,
          featuredLinks: editForm.featuredLinks,
          youtubeChannelId: editForm.youtubeChannelId,
          youtubeHandle: editForm.youtubeHandle,
          creatorDisplayName: editForm.creatorDisplayName,
          socialLinks: { youtube: editForm.youtubeUrl },
        })
      });
      if (res.ok) {
        showToast('Configuration saved', 'success');
        setEditingUser(null);
        load();
      } else {
        showToast('Failed to save', 'error');
      }
    } catch {
      showToast('Connection error', 'error');
    }
  };

  const handleSync = async () => {
    if (!editingUser) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/admin/youtube/sync/${editingUser._id}`, { method: 'POST' });
      const data = await res.json();
      setSyncResult({ videosFetched: data.videosFetched || 0, error: data.error });
      if (!data.error) {
        showToast(`Synced ${data.videosFetched} videos`, 'success');
        fetch(`/api/admin/youtube/videos/${editingUser._id}`)
          .then(r => r.json())
          .then(d => setCachedVideos(Array.isArray(d) ? d : []));
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Sync request failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const toggleVideoFlag = async (videoId: string, field: 'isHidden' | 'isFeatured', current: boolean) => {
    await fetch(`/api/admin/youtube/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    setCachedVideos(prev => prev.map(v =>
      v.videoId === videoId ? { ...v, [field]: !current } : v
    ));
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Creators Settings</h1>
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
          <motion.table variants={staggerContainer} initial="hidden" animate="visible">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Status</th>
                <th>Socials</th>
                <th>Community</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <motion.tr key={u._id} variants={fadeUp}>
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
                </motion.tr>
              ))}
            </tbody>
          </motion.table>
        </div>
      )}

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Configure: ${editingUser?.username}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Configuration</button>
          </>
        }
      >
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
            <label className="form-label">Creator Display Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Shown publicly instead of username"
              value={editForm.creatorDisplayName}
              onChange={e => setEditForm({ ...editForm, creatorDisplayName: e.target.value })}
            />
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <FaYoutube style={{ color: '#ff0000', fontSize: '1.3rem' }} />
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>YouTube Integration</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">YouTube Channel URL</label>
                <input type="text" className="form-input" placeholder="https://youtube.com/@ChannelName"
                  value={editForm.youtubeUrl}
                  onChange={e => setEditForm({ ...editForm, youtubeUrl: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">YouTube Handle</label>
                <input type="text" className="form-input" placeholder="@ChannelHandle"
                  value={editForm.youtubeHandle}
                  onChange={e => setEditForm({ ...editForm, youtubeHandle: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">YouTube Channel ID <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(admin override)</span></label>
                <input type="text" className="form-input" placeholder="UCxxxxxxxxxxxxxxxxxx (auto-resolved on sync)"
                  value={editForm.youtubeChannelId}
                  onChange={e => setEditForm({ ...editForm, youtubeChannelId: e.target.value })} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSync}
                  disabled={syncing}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FaSync style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                  {syncing ? 'Syncing...' : 'Sync YouTube Videos'}
                </button>
                {editingUser?.youtubeLastSynced && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Last synced: {new Date(editingUser.youtubeLastSynced).toLocaleDateString()}
                  </span>
                )}
              </div>

              {syncResult && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: syncResult.error ? 'rgba(255,0,0,0.08)' : 'rgba(34,197,94,0.08)',
                  border: `1px solid ${syncResult.error ? 'rgba(255,0,0,0.2)' : 'rgba(34,197,94,0.2)'}`,
                  fontSize: '0.85rem',
                  color: syncResult.error ? '#f87171' : '#4ade80',
                }}>
                  {syncResult.error ? `Error: ${syncResult.error}` : `✓ ${syncResult.videosFetched} videos fetched and cached`}
                </div>
              )}
            </div>
          </div>

          {cachedVideos.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Cached Videos ({cachedVideos.length})
              </div>
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cachedVideos.map(v => (
                  <motion.div key={v.videoId} variants={fadeUp} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    opacity: v.isHidden ? 0.4 : 1,
                  }}>
                    {v.thumbnailUrl && (
                      <img src={v.thumbnailUrl} alt="" style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(v.publishedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        className={`btn btn-sm ${v.isFeatured ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                        onClick={() => toggleVideoFlag(v.videoId, 'isFeatured', v.isFeatured)}
                        title="Toggle featured"
                      >★</button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.7rem', color: v.isHidden ? '#f87171' : 'var(--text-muted)' }}
                        onClick={() => toggleVideoFlag(v.videoId, 'isHidden', v.isHidden)}
                        title={v.isHidden ? 'Show' : 'Hide'}
                      >{v.isHidden ? '👁' : '🚫'}</button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          <div className={styles.featuredSection}>
            <div className={styles.featuredHeader}>
              <label className="form-label" style={{ margin: 0 }}>Featured Media Links</label>
              <button className="btn btn-primary btn-sm" onClick={() => setEditForm({ ...editForm, featuredLinks: [...editForm.featuredLinks, { title: '', url: '', type: 'youtube', thumbnail: '' }] })}>
                + Add
              </button>
            </div>
            <div className={styles.mediaCardsList}>
              {editForm.featuredLinks.map((link, idx) => (
                <div key={idx} className={styles.mediaAdminCard}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <input className="form-input" style={{ marginBottom: '8px' }} placeholder="Title"
                        value={link.title}
                        onChange={e => { const nl = [...editForm.featuredLinks]; nl[idx].title = e.target.value; setEditForm({ ...editForm, featuredLinks: nl }); }} />
                      <input className="form-input" style={{ marginBottom: '8px' }} placeholder="URL"
                        value={link.url}
                        onChange={e => { const nl = [...editForm.featuredLinks]; nl[idx].url = e.target.value; setEditForm({ ...editForm, featuredLinks: nl }); }} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select className="form-input" style={{ width: '120px' }} value={link.type}
                          onChange={e => { const nl = [...editForm.featuredLinks]; nl[idx].type = e.target.value; setEditForm({ ...editForm, featuredLinks: nl }); }}>
                          <option value="youtube">YouTube</option>
                          <option value="spotify">Spotify</option>
                          <option value="apple">Apple</option>
                          <option value="soundcloud">SoundCloud</option>
                          <option value="other">Other</option>
                        </select>
                        <input className="form-input" placeholder="Thumb URL (optional)" value={link.thumbnail}
                          onChange={e => { const nl = [...editForm.featuredLinks]; nl[idx].thumbnail = e.target.value; setEditForm({ ...editForm, featuredLinks: nl }); }} />
                      </div>
                    </div>
                    <button className="btn btn-ghost" onClick={() => setEditForm({ ...editForm, featuredLinks: editForm.featuredLinks.filter((_, i) => i !== idx) })}
                      style={{ height: 'fit-content', color: 'var(--brand-red)' }}>✕</button>
                  </div>
                </div>
              ))}
              {editForm.featuredLinks.length === 0 && <div className={styles.mediaEmpty}>No featured links added.</div>}
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
