'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getLevelTitle, BADGES } from '@/lib/xp';
import { useProgression } from '@/lib/useProgression';
import styles from './page.module.css';
import { 
  FaYoutube, FaTwitch, FaInstagram, FaTiktok, FaSpotify, 
  FaApple, FaSoundcloud, FaDiscord, FaGlobe 
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

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
  socialLinks?: {
    twitter?: string;
    youtube?: string;
    twitch?: string;
    instagram?: string;
    tiktok?: string;
    spotify?: string;
    appleMusic?: string;
    soundcloud?: string;
    kick?: string;
    discord?: string;
    website?: string;
  };
  featuredLinks?: { title: string; url: string; type?: string; thumbnail?: string }[];
}

interface Submission { 
  _id: string; 
  challengeId: { title: string; xpReward: number; division: string }; 
  proofUrl: string; 
  status: string; 
  createdAt: string; 
}

const KickIcon = ({ size = 16 }: { size?: number }) => (
  <div style={{ 
    width: `${size}px`, 
    height: `${size}px`, 
    background: '#53fc18', 
    color: '#000', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: `${size * 0.6}px`, 
    fontWeight: '900', 
    borderRadius: '3px' 
  }}>K</div>
);

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  twitter: <FaXTwitter />,
  youtube: <FaYoutube />,
  twitch: <FaTwitch />,
  instagram: <FaInstagram />,
  tiktok: <FaTiktok />,
  spotify: <FaSpotify />,
  appleMusic: <FaApple />,
  soundcloud: <FaSoundcloud />,
  kick: <KickIcon />,
  discord: <FaDiscord />,
  website: <FaGlobe />,
};

export default function ProfileClient({ initialProfile, initialSubmissions }: { initialProfile: UserProfile, initialSubmissions: Submission[] }) {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [adminAction, setAdminAction] = useState(false);

  const handleAdminAction = async (action: string) => {
    setAdminAction(true);
    let res;
    if (action === 'promote') {
      res = await fetch(`/api/admin/users/${profile._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
    } else if (action === 'demote') {
      res = await fetch(`/api/admin/users/${profile._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      });
    }

    setAdminAction(false);
    if (res?.ok) {
      const d = await res.json();
      setProfile(prev => ({ ...prev, ...d.user }));
      showToast('Admin action successful!', 'success');
    } else {
      showToast('Admin action failed', 'error');
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuper = currentUser?.role === 'superadmin';
  const levelTitles = useProgression();
  const levelTitle = getLevelTitle(profile.level, levelTitles);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className={styles.page}>
      <div className="container" style={{ position: 'relative', zIndex: 5, paddingTop: '120px' }}>
        <motion.div 
          className={`${styles.profileHeader} premium-panel`}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className={styles.avatarSection}>
            <div className={styles.mainAvatar}>
              {profile.avatar ? <img src={profile.avatar} alt={profile.username} /> : profile.username[0].toUpperCase()}
            </div>
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.username}>{profile.username}</h1>
              <div className={styles.roleRow}>
                {profile.role === 'superadmin' && <span className="badge badge-red" style={{ background: 'linear-gradient(90deg, #ff0055, #cc0000)', color: 'white' }}>SUPERADMIN</span>}
                {profile.role === 'admin' && <span className="badge badge-red">Admin</span>}
              </div>
            </div>
            <div className={styles.levelRow}>
              <span className="badge badge-violet">Level {profile.level}</span>
              <span className={styles.levelTitle}>{levelTitle}</span>
            </div>
            <p className={styles.bio}>{profile.bio || 'This member hasn\'t added a bio yet.'}</p>
            <div className={styles.divisionTags}>
              {profile.divisions.map(d => (
                <span key={d} className={`division-tag tag-${d}`}>
                  {d.replace(/_/g, ' ')}
                </span>
              ))}
            </div>

            <div className={styles.profileSocials}>
              {Object.entries(PLATFORM_ICONS).map(([key, icon]) => {
                const url = profile.socialLinks?.[key as keyof typeof profile.socialLinks];
                if (!url) return null;
                return (
                  <motion.a 
                    key={key} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className={styles.socialIconBtn} 
                    aria-label={key}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 0, 0, 0.15)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {icon}
                  </motion.a>
                );
              })}
            </div>

            <div className={styles.joinedDate}>Member since {new Date(profile.createdAt).getFullYear()}</div>
          </div>

          <div className={`${styles.xpCard} premium-panel`}>
            <div className={styles.xpTop}>
              <div className={styles.xpSummary}>
                <span className={styles.xpEyebrow}>Legacy Score</span>
                <span className={styles.xpTotal}>{profile.xp.toLocaleString()} XP</span>
              </div>
              <span className={styles.xpLevel}>Lv.{profile.level}</span>
            </div>
            <div className={styles.badges}>
              {profile.badges.map(b => {
                const badge = BADGES[b as keyof typeof BADGES];
                return badge ? (
                  <div key={b} className={styles.badgeItem} style={{ color: badge.color }} title={badge.description}>
                    {badge.label}
                  </div>
                ) : <div key={b} className={styles.badgeItem}>{b}</div>;
              })}
            </div>
          </div>
        </motion.div>

        {/* Featured Media Gallery */}
        {profile.featuredLinks && profile.featuredLinks.length > 0 && (
          <div className={styles.mediaSection}>
            <h3 className={styles.sectionTitle}>Featured Media</h3>
            <motion.div 
              className={styles.mediaGrid}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
            >
              {profile.featuredLinks.map((media, idx) => {
                const ytId = getYouTubeId(media.url);
                return (
                  <motion.div key={idx} className={`${styles.mediaCard} premium-panel`} variants={fadeUp}>
                    {ytId ? (
                      <div className={styles.videoWrapper}>
                        <iframe 
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={media.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className={styles.imageWrapper}>
                        <img src={media.url} alt={media.title} />
                      </div>
                    )}
                    <div className={styles.mediaInfo}>
                      <div className={styles.mediaTitle}>{media.title || 'Untitled Content'}</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* Submission History */}
        <div className={styles.historySection} style={{ marginBottom: '4rem' }}>
          <h3 className={styles.sectionTitle}>Challenge History</h3>
          {initialSubmissions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No approved challenge submissions yet.</p>
          ) : (
            <div className={`${styles.historyTable} table-container premium-panel`}>
              <table>
                <thead>
                  <tr><th>Challenge</th><th>Division</th><th>XP</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {initialSubmissions.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.challengeId?.title || 'Unknown'}</td>
                      <td><span className={`division-tag tag-${s.challengeId?.division || 'global'}`}>{s.challengeId?.division || 'global'}</span></td>
                      <td><span style={{ color: 'var(--brand-red)', fontFamily: 'Rajdhani', fontWeight: 700 }}>+{s.challengeId?.xpReward || 0}</span></td>
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
          <div className={`${styles.adminSection} premium-panel`}>
            <h3 className={styles.sectionTitle}>🛡️ Admin Controls</h3>
            <div className={styles.adminButtons}>
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
