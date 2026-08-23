'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getLevelTitle, xpForNextLevel } from '@/lib/xp';
import {
  FaYoutube, FaTwitch, FaInstagram, FaTiktok, FaSpotify,
  FaApple, FaSoundcloud, FaDiscord, FaGlobe, FaSync
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import Modal from '@/components/Modal';
import styles from './page.module.css';

interface User {
  _id: string; username: string; email: string; avatar: string; xp: number; level: number;
  divisions: string[]; badges: string[]; role: string; createdAt: string;
  isPublic?: boolean; isFeatured?: boolean; displayOrder?: number;
  socialLinks?: Record<string, string>;
  featuredLinks?: { title: string; url: string; type?: string; thumbnail?: string }[];
  youtubeChannelId?: string;
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

interface ProgressionLevel {
  level: number;
  title: string;
  xpRequired: number;
}

const divTagClass: Record<string, string> = {
  gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content',
  gaming_creator: 'tag-gaming_creator', music_creator: 'tag-music_creator',
  sport_creator: 'tag-sport_creator', content_creator: 'tag-content_creator',
};

const DIVISION_OPTIONS = [
  { id: 'gaming', label: 'Gaming' },
  { id: 'music', label: 'Music' },
  { id: 'sport', label: 'Sport' },
  { id: 'content', label: 'Content' },
];

const PLATFORM_ICONS: Record<string, any> = {
  twitter: <FaXTwitter />, youtube: <FaYoutube />, twitch: <FaTwitch />, instagram: <FaInstagram />,
  tiktok: <FaTiktok />, spotify: <FaSpotify />, appleMusic: <FaApple />, soundcloud: <FaSoundcloud />,
  kick: <span style={{ fontWeight: 900 }}>K</span>, discord: <FaDiscord />, website: <FaGlobe />,
};

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

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const isSuperadmin = currentUser?.role === 'superadmin';

  const [users, setUsers] = useState<User[]>([]);
  const [progression, setProgression] = useState<ProgressionLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [managingUser, setManagingUser] = useState<User | null>(null);

  // Identity & Role section
  const [identityForm, setIdentityForm] = useState({ username: '', role: '', divisions: [] as string[] });
  const [savingIdentity, setSavingIdentity] = useState(false);

  // XP Override section (superadmin only)
  const [xpValue, setXpValue] = useState(0);
  const [savingXp, setSavingXp] = useState(false);

  // Creator & Visibility section
  const [creatorForm, setCreatorForm] = useState({
    isPublic: false,
    isFeatured: false,
    featuredLinks: [] as { title: string; url: string; type: string; thumbnail: string }[],
    youtubeChannelId: '',
    youtubeHandle: '',
    youtubeUrl: '',
    creatorDisplayName: '',
  });
  const [savingCreator, setSavingCreator] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ videosFetched: number; error?: string } | null>(null);
  const [cachedVideos, setCachedVideos] = useState<CachedVideo[]>([]);

  const loadData = () => {
    setLoading(true);
    void Promise.all([
      fetch('/api/users', { cache: 'no-store' }),
      fetch('/api/progression', { cache: 'no-store' }),
    ])
      .then(async ([usersRes, progRes]) => {
        const usersData = await usersRes.json();
        const progData = await progRes.json();
        setUsers(usersData.users || []);
        setProgression(progData.progression || []);
      })
      .catch(err => {
        console.error('[AdminUsers] Fetch error:', err);
        showToast('Failed to load personnel data', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('stats-refresh', loadData);
    return () => window.removeEventListener('stats-refresh', loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thresholds = progression.map(p => p.xpRequired);
  const titles = progression.map(p => p.title);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const refetchUsers = async () => {
    const res = await fetch('/api/users', { cache: 'no-store' });
    const data = await res.json();
    setUsers(data.users || []);
    return data.users as User[];
  };

  const openManageModal = (user: User) => {
    setManagingUser(user);
    setIdentityForm({ username: user.username, role: user.role, divisions: [...user.divisions] });
    setXpValue(user.xp);
    setSyncResult(null);
    setCreatorForm({
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

  const toggleDivision = (divId: string) => {
    setIdentityForm(prev => ({
      ...prev,
      divisions: prev.divisions.includes(divId)
        ? prev.divisions.filter(d => d !== divId)
        : [...prev.divisions, divId]
    }));
  };

  const handleSaveIdentity = async () => {
    if (!managingUser) return;
    setSavingIdentity(true);
    try {
      const res = await fetch(`/api/users/${managingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identityForm.username,
          divisions: identityForm.divisions,
        })
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to update identity', 'error');
        setSavingIdentity(false);
        return;
      }

      if (isSuperadmin && identityForm.role !== managingUser.role) {
        const roleRes = await fetch(`/api/admin/users/${managingUser._id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: identityForm.role })
        });
        if (!roleRes.ok) {
          const data = await roleRes.json();
          showToast(data.error || 'Failed to update role', 'error');
        }
      }

      const updated = await refetchUsers();
      const fresh = updated.find(u => u._id === managingUser._id);
      if (fresh) setManagingUser(fresh);
      showToast('Identity updated', 'success');
    } catch {
      showToast('Connection error', 'error');
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleSaveXp = async () => {
    if (!managingUser) return;
    setSavingXp(true);
    try {
      const res = await fetch(`/api/admin/users/${managingUser._id}/xp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: xpValue })
      });
      if (res.ok) {
        showToast(`XP synchronized for ${managingUser.username}`, 'success');
        const updated = await refetchUsers();
        const fresh = updated.find(u => u._id === managingUser._id);
        if (fresh) setManagingUser(fresh);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update XP', 'error');
      }
    } catch {
      showToast('Network error during synchronization', 'error');
    } finally {
      setSavingXp(false);
    }
  };

  const handleSaveCreator = async () => {
    if (!managingUser) return;
    setSavingCreator(true);
    try {
      const res = await fetch(`/api/users/${managingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: creatorForm.isPublic,
          isFeatured: creatorForm.isFeatured,
          featuredLinks: creatorForm.featuredLinks,
          youtubeChannelId: creatorForm.youtubeChannelId,
          youtubeHandle: creatorForm.youtubeHandle,
          creatorDisplayName: creatorForm.creatorDisplayName,
          socialLinks: { youtube: creatorForm.youtubeUrl },
        })
      });
      if (res.ok) {
        showToast('Creator configuration saved', 'success');
        await refetchUsers();
      } else {
        showToast('Failed to save creator configuration', 'error');
      }
    } catch {
      showToast('Connection error', 'error');
    } finally {
      setSavingCreator(false);
    }
  };

  const handleSync = async () => {
    if (!managingUser) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/admin/youtube/sync/${managingUser._id}`, { method: 'POST' });
      const data = await res.json();
      setSyncResult({ videosFetched: data.videosFetched || 0, error: data.error });
      if (!data.error) {
        showToast(`Synced ${data.videosFetched} videos`, 'success');
        fetch(`/api/admin/youtube/videos/${managingUser._id}`)
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
    setCachedVideos(prev => prev.map(v => v.videoId === videoId ? { ...v, [field]: !current } : v));
  };

  const previewLevel = (() => {
    let level = 1;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xpValue >= thresholds[i]) { level = i + 1; break; }
    }
    return level;
  })();

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Personnel</h1>
            <p className={styles.sub}>One roster for every member — identity, XP, and creator settings</p>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              className="form-input"
              style={{ width: '320px', minHeight: '46px' }}
              placeholder="Search by username or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '10rem' }}>
            <div className="loader-visual" style={{ margin: '0 auto' }}>
              <div className="loader-arc" />
              <img src="/brand/logo.png" alt="" className="loader-logo" />
            </div>
            <p className="loader-text" style={{ marginTop: '2rem' }}>Scanning personnel...</p>
          </div>
        ) : (
          <motion.div className={styles.userGrid} variants={staggerContainer}>
            {filtered.map(u => {
              const xpData = xpForNextLevel(u.xp, thresholds);
              return (
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
                      {isSuperadmin && <div className={styles.email}>{u.email}</div>}
                      <div className={`${styles.roleBadge} ${styles[u.role] || styles.user}`}>
                        {u.role === 'superadmin' ? 'Superadmin' : u.role === 'admin' ? 'Admin' : 'User'}
                      </div>
                    </div>
                  </div>

                  <div className={styles.progressSection}>
                    <div className={styles.xpMeta}>
                      <span className={styles.xpCount}>
                        <strong>{u.xp.toLocaleString()}</strong> / {xpData.needed > 0 ? (u.xp + (xpData.needed - xpData.current)).toLocaleString() : 'MAX'} XP
                      </span>
                      <span className={styles.xpPercent}>{getLevelTitle(u.level, titles)}</span>
                    </div>
                    <div className={styles.miniXpBar}>
                      <div className={styles.miniXpFill} style={{ width: `${xpData.progress}%` }} />
                    </div>
                  </div>

                  <div className={styles.divisionsRow}>
                    {u.divisions.length > 0 ? u.divisions.map(d => (
                      <span key={d} className={`division-tag ${divTagClass[d] || ''}`}>{d.replace(/_/g, ' ')}</span>
                    )) : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No division</span>}
                    {u.isPublic && <span className={styles.statusChip} style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>PUBLIC</span>}
                    {u.isFeatured && <span className={styles.statusChip} style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>FEATURED</span>}
                  </div>

                  <div className={styles.cardActions}>
                    <a href={`/users/${u._id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>View Profile</a>
                    <button className="btn btn-primary btn-sm" onClick={() => openManageModal(u)} style={{ flex: 1 }}>Manage</button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      <Modal
        isOpen={!!managingUser}
        onClose={() => setManagingUser(null)}
        title={`Manage: ${managingUser?.username}`}
        maxWidth="700px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Identity & Role — admin can edit divisions/role, only superadmin can rename */}
          <section>
            <h4 className={styles.sectionHeading}>Identity &amp; Role</h4>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                value={identityForm.username}
                onChange={e => setIdentityForm({ ...identityForm, username: e.target.value })}
                disabled={!isSuperadmin}
                pattern="[a-zA-Z0-9_-]+"
                title="Letters, numbers, hyphens, and underscores only"
                style={!isSuperadmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
              {!isSuperadmin && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Only superadmins can rename accounts.
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              {managingUser?.role === 'superadmin' ? (
                <>
                  <input className="form-input" value="Superadmin" disabled readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Superadmin roles are protected and can&apos;t be changed here.
                  </p>
                </>
              ) : (
                <>
                  <select
                    className="form-input"
                    value={identityForm.role}
                    onChange={e => setIdentityForm({ ...identityForm, role: e.target.value })}
                    disabled={!isSuperadmin}
                    style={!isSuperadmin ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {!isSuperadmin && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Only superadmins can change roles.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Divisions</label>
              <div className="multi-chip-group">
                {DIVISION_OPTIONS.map(div => {
                  const active = identityForm.divisions.includes(div.id);
                  return (
                    <button
                      key={div.id}
                      type="button"
                      className={`multi-chip ${active ? 'multi-chip-active' : ''}`}
                      onClick={() => toggleDivision(div.id)}
                    >
                      {div.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSaveIdentity} disabled={savingIdentity} style={{ marginTop: '16px' }}>
              {savingIdentity ? 'Saving...' : 'Save Identity'}
            </button>
          </section>

          {/* XP Override — superadmin only, entire section hidden otherwise */}
          {isSuperadmin && (
            <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
              <h4 className={styles.sectionHeading}>XP Override</h4>
              <div className={styles.modalXpInfo}>
                <div>
                  <div className={styles.previewLabel}>Current XP</div>
                  <div className={styles.previewValue}>{managingUser?.xp.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.previewLabel}>Preview Level</div>
                  <div className={`${styles.previewValue} ${xpValue !== managingUser?.xp ? styles.new : ''}`}>Lv.{previewLevel}</div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Target XP Value</label>
                <input
                  type="number"
                  className="form-input"
                  value={xpValue}
                  onChange={e => setXpValue(Number(e.target.value))}
                  min="0"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Rank: {getLevelTitle(previewLevel, titles)}
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleSaveXp} disabled={savingXp} style={{ marginTop: '16px' }}>
                {savingXp ? 'Syncing...' : 'Save XP'}
              </button>
            </section>
          )}

          {/* Creator & Visibility — any admin */}
          <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
            <h4 className={styles.sectionHeading}>Creator &amp; Visibility</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ToggleSwitch
                checked={creatorForm.isPublic}
                onChange={v => setCreatorForm({ ...creatorForm, isPublic: v })}
                label="Public Visibility"
                sublabel="Show this member in the community directory"
              />
              <ToggleSwitch
                checked={creatorForm.isFeatured}
                onChange={v => setCreatorForm({ ...creatorForm, isFeatured: v })}
                label="Featured Creator"
                sublabel="Highlight in the featured section and hub hero"
              />

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Creator Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Shown publicly instead of username"
                  value={creatorForm.creatorDisplayName}
                  onChange={e => setCreatorForm({ ...creatorForm, creatorDisplayName: e.target.value })}
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <FaYoutube style={{ color: '#ff0000', fontSize: '1.2rem' }} />
                  <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>YouTube Integration</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Channel URL</label>
                    <input type="text" className="form-input" placeholder="https://youtube.com/@ChannelName"
                      value={creatorForm.youtubeUrl}
                      onChange={e => setCreatorForm({ ...creatorForm, youtubeUrl: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Handle</label>
                    <input type="text" className="form-input" placeholder="@ChannelHandle"
                      value={creatorForm.youtubeHandle}
                      onChange={e => setCreatorForm({ ...creatorForm, youtubeHandle: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaSync style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                      {syncing ? 'Syncing...' : 'Sync YouTube Videos'}
                    </button>
                    {managingUser?.youtubeLastSynced && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Last synced: {new Date(managingUser.youtubeLastSynced).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {syncResult && (
                    <div style={{
                      padding: '10px 14px', borderRadius: '8px',
                      background: syncResult.error ? 'rgba(255,0,0,0.08)' : 'rgba(34,197,94,0.08)',
                      border: `1px solid ${syncResult.error ? 'rgba(255,0,0,0.2)' : 'rgba(34,197,94,0.2)'}`,
                      fontSize: '0.82rem', color: syncResult.error ? '#f87171' : '#4ade80',
                    }}>
                      {syncResult.error ? `Error: ${syncResult.error}` : `✓ ${syncResult.videosFetched} videos fetched and cached`}
                    </div>
                  )}
                </div>
              </div>

              {cachedVideos.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    Cached Videos ({cachedVideos.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                    {cachedVideos.map(v => (
                      <div key={v.videoId} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px',
                        borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        opacity: v.isHidden ? 0.4 : 1,
                      }}>
                        {v.thumbnailUrl && <img src={v.thumbnailUrl} alt={v.title} style={{ width: '70px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(v.publishedAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button className={`btn btn-sm ${v.isFeatured ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '4px 10px', fontSize: '0.68rem' }}
                            onClick={() => toggleVideoFlag(v.videoId, 'isFeatured', v.isFeatured)} title="Toggle featured">★</button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: '0.68rem', color: v.isHidden ? '#f87171' : 'var(--text-muted)' }}
                            onClick={() => toggleVideoFlag(v.videoId, 'isHidden', v.isHidden)} title={v.isHidden ? 'Show' : 'Hide'}>{v.isHidden ? '👁' : '🚫'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.featuredSection}>
                <div className={styles.featuredHeader}>
                  <label className="form-label" style={{ margin: 0 }}>Featured Media Links</label>
                  <button className="btn btn-primary btn-sm" onClick={() => setCreatorForm({ ...creatorForm, featuredLinks: [...creatorForm.featuredLinks, { title: '', url: '', type: 'youtube', thumbnail: '' }] })}>
                    + Add
                  </button>
                </div>
                <div className={styles.mediaCardsList}>
                  {creatorForm.featuredLinks.map((link, idx) => (
                    <div key={idx} className={styles.mediaAdminCard}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <input className="form-input" style={{ marginBottom: '8px' }} placeholder="Title"
                            value={link.title}
                            onChange={e => { const nl = [...creatorForm.featuredLinks]; nl[idx].title = e.target.value; setCreatorForm({ ...creatorForm, featuredLinks: nl }); }} />
                          <input className="form-input" style={{ marginBottom: '8px' }} placeholder="URL"
                            value={link.url}
                            onChange={e => { const nl = [...creatorForm.featuredLinks]; nl[idx].url = e.target.value; setCreatorForm({ ...creatorForm, featuredLinks: nl }); }} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select className="form-input" style={{ width: '120px' }} value={link.type}
                              onChange={e => { const nl = [...creatorForm.featuredLinks]; nl[idx].type = e.target.value; setCreatorForm({ ...creatorForm, featuredLinks: nl }); }}>
                              <option value="youtube">YouTube</option>
                              <option value="spotify">Spotify</option>
                              <option value="apple">Apple</option>
                              <option value="soundcloud">SoundCloud</option>
                              <option value="other">Other</option>
                            </select>
                            <input className="form-input" placeholder="Thumb URL (optional)" value={link.thumbnail}
                              onChange={e => { const nl = [...creatorForm.featuredLinks]; nl[idx].thumbnail = e.target.value; setCreatorForm({ ...creatorForm, featuredLinks: nl }); }} />
                          </div>
                        </div>
                        <button className="btn btn-ghost" onClick={() => setCreatorForm({ ...creatorForm, featuredLinks: creatorForm.featuredLinks.filter((_, i) => i !== idx) })}
                          style={{ height: 'fit-content', color: 'var(--brand-red)' }}>✕</button>
                      </div>
                    </div>
                  ))}
                  {creatorForm.featuredLinks.length === 0 && <div className={styles.mediaEmpty}>No featured links added.</div>}
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSaveCreator} disabled={savingCreator} style={{ marginTop: '20px' }}>
              {savingCreator ? 'Saving...' : 'Save Creator Settings'}
            </button>
          </section>
        </div>
      </Modal>
    </>
  );
}
