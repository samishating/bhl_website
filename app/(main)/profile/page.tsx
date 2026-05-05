'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import HomeFixedBackground from '@/components/HomeFixedBackground';
import styles from './page.module.css';
import { 
  FaYoutube, FaTwitch, FaInstagram, FaTiktok, FaSpotify, 
  FaApple, FaSoundcloud, FaDiscord, FaGlobe 
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

// Fallback for Kick if not in the version of react-icons
const KickIcon = () => (
  <div style={{ 
    width: '18px', 
    height: '18px', 
    background: '#53fc18', 
    color: '#000', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '11px', 
    fontWeight: '900', 
    borderRadius: '3px' 
  }}>K</div>
);

const SOCIAL_PLATFORMS = [
  { id: 'twitter', label: 'X / Twitter', icon: <FaXTwitter />, placeholder: 'https://x.com/username' },
  { id: 'youtube', label: 'YouTube', icon: <FaYoutube />, placeholder: 'https://youtube.com/@username' },
  { id: 'twitch', label: 'Twitch', icon: <FaTwitch />, placeholder: 'https://twitch.tv/username' },
  { id: 'instagram', label: 'Instagram', icon: <FaInstagram />, placeholder: 'https://instagram.com/username' },
  { id: 'tiktok', label: 'TikTok', icon: <FaTiktok />, placeholder: 'https://tiktok.com/@username' },
  { id: 'spotify', label: 'Spotify', icon: <FaSpotify />, placeholder: 'Spotify artist/profile URL' },
  { id: 'appleMusic', label: 'Apple Music', icon: <FaApple />, placeholder: 'Apple Music artist/profile URL' },
  { id: 'soundcloud', label: 'SoundCloud', icon: <FaSoundcloud />, placeholder: 'https://soundcloud.com/username' },
  { id: 'kick', label: 'Kick', icon: <KickIcon />, placeholder: 'https://kick.com/username' },
  { id: 'discord', label: 'Discord', icon: <FaDiscord />, placeholder: 'username or invite URL' },
  { id: 'website', label: 'Portfolio', icon: <FaGlobe />, placeholder: 'https://yourwebsite.com' },
];

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [form, setForm] = useState({
    bio: '',
    avatar: '',
    socialLinks: {
      twitter: '',
      youtube: '',
      twitch: '',
      instagram: '',
      tiktok: '',
      spotify: '',
      appleMusic: '',
      soundcloud: '',
      kick: '',
      discord: '',
      website: '',
    }
  });

  useEffect(() => {
    if (user) {
      setForm({
        bio: user.bio || '',
        avatar: user.avatar || '',
        socialLinks: {
          twitter: user.socialLinks?.twitter || '',
          youtube: user.socialLinks?.youtube || '',
          twitch: user.socialLinks?.twitch || '',
          instagram: user.socialLinks?.instagram || '',
          tiktok: user.socialLinks?.tiktok || '',
          spotify: user.socialLinks?.spotify || '',
          appleMusic: user.socialLinks?.appleMusic || '',
          soundcloud: user.socialLinks?.soundcloud || '',
          kick: user.socialLinks?.kick || '',
          discord: user.socialLinks?.discord || '',
          website: user.socialLinks?.website || '',
        }
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setEditMode(false);
        showToast('Profile updated successfully', 'success');
        refreshUser();
      } else {
        const data = await res.json();
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.page}>
      <HomeFixedBackground />
      
      <div className="container" style={{ position: 'relative', zIndex: 10, paddingBottom: '80px' }}>
        <header className={styles.header}>
          <div className="section-tag">Identity</div>
          <h1 className={styles.title}>Your <span className="gradient-text">Profile</span></h1>
          <p className={styles.subtitle}>Manage your digital presence within the Brotherhood.</p>
        </header>

        <div className={styles.profileLayout}>
          {/* Main Info Card */}
          <div className={`${styles.card} ${editMode ? styles.editActive : ''}`}>
            {!editMode ? (
              <div className={styles.viewMode}>
                <div className={styles.profileHero}>
                  <div className={styles.avatarWrapper}>
                    <div className={styles.avatarLarge}>
                      {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username[0].toUpperCase()}
                    </div>
                  </div>
                  <div className={styles.heroInfo}>
                    <h2 className={styles.username}>{user.username}</h2>
                    <div className={styles.badgeRow}>
                      <span className="badge badge-red">Level {user.level}</span>
                      <span className="badge badge-violet">{user.role}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.bioSection}>
                  <h3 className={styles.sectionTitle}>BIO</h3>
                  <p className={styles.bioText}>{user.bio || 'No bio provided yet.'}</p>
                </div>

                <div className={styles.socialGrid}>
                  <h3 className={styles.sectionTitle}>SOCIAL LINKS</h3>
                  <div className={styles.socialRow}>
                    {SOCIAL_PLATFORMS.map(p => {
                      const url = user.socialLinks?.[p.id as keyof typeof user.socialLinks];
                      if (!url) return null;
                      return (
                        <a key={p.id} href={url} target="_blank" rel="noreferrer" className={styles.socialIconBtn} aria-label={p.label}>
                          {p.icon}
                        </a>
                      );
                    })}
                    {(!user.socialLinks || Object.values(user.socialLinks).every(v => !v)) && (
                      <p className={styles.mutedText}>No social links connected.</p>
                    )}
                  </div>
                </div>

                <button className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => setEditMode(true)}>
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className={styles.editForm}>
                <div className={styles.formGrid}>
                  {/* Left Column: Profile Info */}
                  <div className={styles.formColumn}>
                    <h3 className={styles.formSectionTitle}>Profile Info</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input className="form-input" value={user.username} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                      <p className={styles.inputHelper}>Usernames can only be changed by staff.</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Avatar URL</label>
                      <input 
                        className="form-input" 
                        placeholder="https://image-link.com/avatar.jpg" 
                        value={form.avatar}
                        onChange={e => setForm({ ...form, avatar: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Bio</label>
                      <textarea 
                        className="form-input" 
                        rows={6} 
                        placeholder="Tell the Brotherhood about yourself..." 
                        value={form.bio}
                        onChange={e => setForm({ ...form, bio: e.target.value })}
                        style={{ resize: 'none', minHeight: '130px' }}
                      />
                    </div>

                    <div className={styles.formActions}>
                      <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setEditMode(false)} style={{ flex: 1 }}>
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Social Links */}
                  <div className={styles.formColumn}>
                    <h3 className={styles.formSectionTitle}>SOCIAL LINKS</h3>
                    <p className={styles.inputHelper} style={{ marginBottom: '24px' }}>
                      Add the platforms you want visible on your public profile.
                    </p>

                    <div className={styles.socialInputsList}>
                      {SOCIAL_PLATFORMS.map(p => (
                        <div key={p.id} className={styles.socialInputGroup}>
                          <label className={styles.socialLabel}>
                            <span className={styles.platformIcon}>{p.icon}</span>
                            {p.label}
                          </label>
                          <div className={styles.inputWithIcon}>
                            <input 
                              type="text"
                              className="form-input"
                              placeholder={p.placeholder}
                              value={form.socialLinks[p.id as keyof typeof form.socialLinks] || ''}
                              onChange={e => setForm({
                                ...form,
                                socialLinks: {
                                  ...form.socialLinks,
                                  [p.id]: e.target.value
                                }
                              })}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
