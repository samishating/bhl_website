'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { xpForNextLevel, getLevelTitle, BADGES, calculateLevel } from '@/lib/xp';
import styles from './page.module.css';

const DIVISION_OPTIONS = [
  { id: 'gaming', label: 'Gaming', icon: '🎮', image: '/brand/gaming.png', color: '#FF0000' },
  { id: 'music', label: 'Music', icon: '🎵', image: '/brand/music.png', color: '#FFFDBA' },
  { id: 'sport', label: 'Sport', icon: '💪', image: '/brand/sport.png', color: '#FF5050' },
  { id: 'content', label: 'Content', icon: '🎬', image: '/brand/logo.png', color: '#CC0000' },
];

interface Submission { _id: string; challengeId: { title: string; xpReward: number; division: string }; proofUrl: string; status: string; createdAt: string; }

export default function ProfilePage() {
  const { user, loading, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [username, setUsername] = useState('');
  const [divisions, setDivisions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [claimingXp, setClaimingXp] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (!user) return;
    setBio(user.bio || '');
    setAvatar(user.avatar || '');
    setUsername(user.username || '');
    setDivisions(user.divisions || []);

    fetch(`/api/submissions?userId=${user.id}`)
      .then(r => r.json())
      .then(d => setSubmissions(d.submissions || []));
  }, [user, loading, router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, avatar, username, divisions }),
    });
    setSaving(false);
    if (res.ok) { await refreshUser(); setEditing(false); showToast('✅ Profile updated!'); }
    else showToast('❌ Failed to save');
  };

  const handleDailyXp = async () => {
    setClaimingXp(true);
    const res = await fetch('/api/xp/daily', { method: 'POST' });
    const data = await res.json();
    setClaimingXp(false);
    if (res.ok) {
      await refreshUser();
      showToast(data.gained ? `🔥 +${data.gained} XP! Daily login reward claimed!` : '⏳ Already claimed today', 'success');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (!user) return null;

  const xpInfo = xpForNextLevel(user.xp);
  const levelTitle = getLevelTitle(user.level);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <div className={`avatar avatar-xl ${styles.mainAvatar}`}>
              {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username[0].toUpperCase()}
            </div>
            <div className={styles.rankRing} />
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.username}>{user.username}</h1>
              {user.role === 'superadmin' && <span className="badge badge-red" style={{ background: 'linear-gradient(90deg, #ff0055, #cc0000)' }}>SUPERADMIN</span>}
              {user.role === 'admin' && <span className="badge badge-red">Admin</span>}
            </div>
            <div className={styles.levelRow}>
              <span className="badge badge-violet">Level {user.level}</span>
              <span className={styles.levelTitle}>{levelTitle}</span>
            </div>
            <p className={styles.bio}>{user.bio || 'No bio yet.'}</p>
            <div className={styles.divisionTags}>
              {user.divisions.map(d => (
                <span key={d} className={`division-tag tag-${d}`}>{d}</span>
              ))}
              {user.divisions.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No divisions joined yet</span>}
            </div>

            <div className={styles.profileActions}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)} id="edit-profile-btn">
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleDailyXp} disabled={claimingXp} id="claim-daily-xp-btn">
                {claimingXp ? '…' : '🔥 Claim Daily XP'}
              </button>
            </div>
          </div>

          {/* XP Card */}
          <div className={styles.xpCard}>
            <div className={styles.xpTop}>
              <span className={styles.xpTotal}>{user.xp.toLocaleString()} XP</span>
              <span className={styles.xpLevel}>Lv.{user.level}</span>
            </div>
            <div className={styles.xpBarLabel}>
              <span>{xpInfo.current} / {xpInfo.needed} XP to next level</span>
              <span>{xpInfo.progress}%</span>
            </div>
            <div className="xp-bar-container">
              <div className="xp-bar-fill" style={{ width: `${xpInfo.progress}%` }} />
            </div>
            <div className={styles.badges}>
              {user.badges.map(b => {
                const badge = BADGES[b as keyof typeof BADGES];
                return badge ? (
                  <span key={b} className={styles.badgeItem} style={{ color: badge.color }} title={badge.description}>
                    {badge.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className={styles.editSection}>
            <h3 className={styles.sectionTitle}>Edit Profile</h3>
            <div className={styles.editForm}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="New username" id="profile-username-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Avatar URL or Upload</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="form-input" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://…" id="profile-avatar-input" />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploading ? '⌛ Uploading...' : '📂 Upload'}
                    <input type="file" style={{ display: 'none' }} disabled={uploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.url) {
                          setAvatar(data.url);
                          showToast('✅ Avatar uploaded!');
                        } else {
                          showToast(`❌ Upload failed: ${data.error}`);
                        }
                      } catch {
                        showToast('❌ Upload error');
                      } finally {
                        setUploading(false);
                      }
                    }} />
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the Brotherhood who you are…" id="profile-bio-input" style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Divisions</label>
                <div className={styles.divisionPicker}>
                  {DIVISION_OPTIONS.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      className={`${styles.divPickBtn} ${divisions.includes(d.id) ? styles.divPickActive : ''}`}
                      style={{ '--div-color': d.color } as React.CSSProperties}
                      onClick={() => setDivisions(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])}
                      id={`pick-division-${d.id}`}
                    >
                      {d.image ? (
                      <img src={d.image} alt={d.label} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                    ) : (
                      <span>{d.icon}</span>
                    )} {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-profile-btn">
                {saving ? '…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Submission History */}
        <div className={styles.historySection}>
          <h3 className={styles.sectionTitle}>Challenge History</h3>
          {submissions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No challenge submissions yet. Go earn some XP!</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Challenge</th><th>Division</th><th>XP</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.challengeId?.title || 'Unknown'}</td>
                      <td><span className={`division-tag tag-${s.challengeId?.division || 'global'}`}>{s.challengeId?.division || 'global'}</span></td>
                      <td><span style={{ color: 'var(--neon-blue)', fontFamily: 'Rajdhani', fontWeight: 700 }}>+{s.challengeId?.xpReward || 0}</span></td>
                      <td><span className={`badge ${s.status === 'approved' ? 'badge-green' : s.status === 'rejected' ? 'badge-red' : 'badge-blue'}`}>{s.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
