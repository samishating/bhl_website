'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getLevelTitle, BADGES } from '@/lib/xp';
import styles from './page.module.css';

interface UserProfile {
  _id: string;
  username: string;
  avatar: string;
  bio: string;
  xp: number;
  level: number;
  divisions: string[];
  badges: string[];
  role: string;
  createdAt: string;
}

interface Submission { 
  _id: string; 
  challengeId: { title: string; xpReward: number; division: string }; 
  proofUrl: string; 
  status: string; 
  createdAt: string; 
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser, refreshUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [adminAction, setAdminAction] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.user) setProfile(d.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/submissions?userId=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.submissions) setSubmissions(d.submissions);
      })
      .catch(console.error);
  }, [id]);

  const handleAdminAction = async (action: string) => {
    if (!profile) return;
    setAdminAction(true);
    
    let res;
    if (action === 'reset_xp') {
      res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: 0, level: 1 }),
      });
    } else if (action === 'promote') {
      res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
    } else if (action === 'demote') {
      res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      });
    }

    setAdminAction(false);
    if (res?.ok) {
      const d = await res.json();
      setProfile(prev => prev ? { ...prev, ...d.user } : null);
      showToast('✅ Admin action successful!');
    } else {
      showToast('❌ Admin action failed');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (!profile) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}><h1>User not found</h1></div>;

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuper = currentUser?.role === 'superadmin';
  const levelTitle = getLevelTitle(profile.level);

  return (
    <div className={styles.page}>
      {toast && <div className="toast">{toast}</div>}
      
      <div className="container">
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <div className={`avatar avatar-xl ${styles.mainAvatar}`}>
              {profile.avatar ? <img src={profile.avatar} alt={profile.username} /> : profile.username[0].toUpperCase()}
            </div>
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.username}>{profile.username}</h1>
              {profile.role === 'superadmin' && <span className="badge badge-red" style={{ background: 'linear-gradient(90deg, #ff0055, #cc0000)' }}>SUPERADMIN</span>}
              {profile.role === 'admin' && <span className="badge badge-red">Admin</span>}
            </div>
            <div className={styles.levelRow}>
              <span className="badge badge-violet">Level {profile.level}</span>
              <span className={styles.levelTitle}>{levelTitle}</span>
            </div>
            <p className={styles.bio}>{profile.bio || 'This member hasn\'t added a bio yet.'}</p>
            <div className={styles.divisionTags}>
              {profile.divisions.map(d => (
                <span key={d} className={`division-tag tag-${d}`}>{d}</span>
              ))}
            </div>
            <div className={styles.joinedDate}>Joined {new Date(profile.createdAt).toLocaleDateString()}</div>
          </div>

          <div className={styles.xpCard}>
            <div className={styles.xpTop}>
              <span className={styles.xpTotal}>{profile.xp.toLocaleString()} XP</span>
              <span className={styles.xpLevel}>Lv.{profile.level}</span>
            </div>
            <div className={styles.badges}>
              {profile.badges.map(b => {
                const badge = BADGES[b as keyof typeof BADGES];
                return badge ? (
                  <span key={b} className={styles.badgeItem} style={{ color: badge.color }} title={badge.description}>
                    {badge.label}
                  </span>
                ) : <span key={b}>{b}</span>;
              })}
            </div>
          </div>
        </div>

        {/* Submission History */}
        <div className={styles.historySection} style={{ marginTop: '2rem' }}>
          <h3 className={styles.sectionTitle}>Challenge History</h3>
          {submissions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No approved challenge submissions yet.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Challenge</th><th>Division</th><th>XP</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.challengeId?.title || 'Unknown'}</td>
                      <td><span className={`division-tag tag-${s.challengeId?.division || 'global'}`}>{s.challengeId?.division || 'global'}</span></td>
                      <td><span style={{ color: 'var(--neon-blue)', fontFamily: 'Rajdhani', fontWeight: 700 }}>+{s.challengeId?.xpReward || 0}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Controls */}
        {isAdmin && profile.role !== 'superadmin' && (
          <div className={styles.adminSection}>
            <h3 className={styles.sectionTitle}>🛡️ Admin Controls</h3>
            <div className={styles.adminButtons}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAdminAction('reset_xp')} disabled={adminAction}>
                Reset XP
              </button>
              {isSuper && profile.role === 'user' && (
                <button className="btn btn-primary btn-sm" onClick={() => handleAdminAction('promote')} disabled={adminAction}>
                  Promote to Admin
                </button>
              )}
              {isSuper && profile.role === 'admin' && (
                <button className="btn btn-danger btn-sm" onClick={() => handleAdminAction('demote')} disabled={adminAction}>
                  Demote to Member
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/admin/users`)}>
                Manage in Panel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
