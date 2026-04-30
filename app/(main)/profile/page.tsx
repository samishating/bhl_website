'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { xpForNextLevel, getLevelTitle, BADGES, calculateLevel } from '@/lib/xp';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/image';
import styles from './page.module.css';



interface Submission { _id: string; challengeId: { title: string; xpReward: number; division: string }; proofUrl: string; status: string; createdAt: string; }

export default function ProfilePage() {
  const { user, loading, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [claimingXp, setClaimingXp] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (!user) return;
    setBio(user.bio || '');
    setAvatar(user.avatar || '');
    setUsername(user.username || '');

    fetch(`/api/submissions?userId=${user.id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setSubmissions(d.submissions || []));
  }, [user, loading, router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, avatar, username }),
    });
    setSaving(false);
    if (res.ok) { 
      await refreshUser(); 
      setEditing(false); 
      showToast('Profile updated!', 'success'); 
      window.dispatchEvent(new Event('stats-refresh'));
    }
    else showToast('Failed to save', 'error');
  };

  const handleDailyXp = async () => {
    setClaimingXp(true);
    const res = await fetch('/api/xp/daily', { method: 'POST' });
    const data = await res.json();
    setClaimingXp(false);
    if (res.ok) {
      await refreshUser();
      showToast(data.gained ? `+${data.gained} XP! Daily login reward claimed!` : 'Already claimed today', 'success');
      window.dispatchEvent(new Event('stats-refresh'));
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      setUploading(true);
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to crop');
      
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');
      
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setAvatar(data.url);
        showToast('Avatar uploaded!', 'success');
        setImageToCrop(null);
      } else {
        showToast(`Upload failed: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast('Error processing image', 'error');
    } finally {
      setUploading(false);
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
              {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={styles.rankRing} />
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.username}>{user.username}</h1>
              {user.role === 'superadmin' && <span className="badge badge-red" style={{ background: 'linear-gradient(90deg, #ff0055, #cc0000)', color: 'white' }}>SUPERADMIN</span>}
              {user.role === 'admin' && <span className="badge badge-red">Admin</span>}
            </div>
            <div className={styles.levelRow}>
              <span className="badge badge-violet">Level {user.level}</span>
              <span className={styles.levelTitle}>{levelTitle}</span>
            </div>
            <p className={styles.bio}>{user.bio || 'No bio yet.'}</p>
            <div className={styles.divisionTags}>
              {(user.divisions || []).map(d => (
                <span key={d} className={`division-tag tag-${d}`}>{d}</span>
              ))}
              {(!user.divisions || user.divisions.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No divisions joined yet</span>}
            </div>

            <div className={styles.profileActions}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)} id="edit-profile-btn">
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
                <button className="btn btn-primary btn-sm" onClick={handleDailyXp} disabled={claimingXp} id="claim-daily-xp-btn">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {claimingXp ? '…' : (
                      <>
                        <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} />
                        Claim Daily XP
                      </>
                    )}
                  </span>
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
              {(user.badges || []).map(b => {
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

        {/* Image Cropper Modal */}
        {imageToCrop && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ position: 'relative', width: '100%', height: '70vh', maxWidth: '800px', background: '#000' }}>
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            </div>
            <div style={{ padding: '2rem', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand-red)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setImageToCrop(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCropSave} disabled={uploading}>
                  {uploading ? 'Processing...' : 'Apply Crop'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {editing && (
          <div className={styles.editSection}>
            {saving && (
              <div className={styles.loadingOverlay}>
                <div className="spinner" />
                <span style={{ fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Updating Profile...</span>
              </div>
            )}
            <h3 className={styles.sectionTitle}>Edit Profile</h3>
            <div className={styles.editForm}>
              <div className="form-group">
                <label className="form-label">Username {user.role !== 'superadmin' && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 400 }}>(Permanent)</span>}</label>
                <input 
                  className="form-input" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  placeholder="New username" 
                  id="profile-username-input" 
                  disabled={user.role !== 'superadmin'}
                  style={user.role !== 'superadmin' ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profile Picture</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', width: '100%', justifyContent: 'center' }}>
                    {uploading ? '⌛ Processing...' : '📂 Click to Upload New Avatar'}
                    <input type="file" style={{ display: 'none' }} disabled={uploading} accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.addEventListener('load', () => {
                          setImageToCrop(reader.result as string);
                        });
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the Brotherhood who you are…" id="profile-bio-input" style={{ resize: 'vertical' }} />
              </div>

              <button 
                className="btn btn-primary" 
                onClick={handleSave} 
                disabled={saving || uploading} 
                id="save-profile-btn" 
                style={{ 
                  minWidth: '160px', 
                  justifyContent: 'center',
                  ...( (saving || uploading) ? { 
                    background: '#333', 
                    color: '#666', 
                    border: '1px solid #444', 
                    boxShadow: 'none', 
                    cursor: 'not-allowed' 
                  } : {} )
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
