'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import HomeFixedBackground from '@/components/HomeFixedBackground';
import CreatorVideoCarousel from './CreatorVideoCarousel';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/animations';
import styles from './page.module.css';
import { 
  FaYoutube, FaTwitch, FaInstagram, FaTiktok, FaSpotify, 
  FaApple, FaSoundcloud, FaDiscord, FaGlobe,
  FaGamepad, FaVideo, FaMusic, FaRunning, FaShieldAlt
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { calculateLevel, getLevelTitle } from '@/lib/xp';

interface SocialLinks {
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
}

interface User {
  _id: string;
  username: string;
  avatar: string;
  bio: string;
  level: number;
  xp: number;
  divisions: string[];
  socialLinks?: SocialLinks;
  featuredLinks?: { title: string; url: string; type?: string }[];
}

const KickIcon = ({ size = 14 }: { size?: number }) => (
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
    borderRadius: '2px' 
  }}>K</div>
);

const PLATFORM_ICONS: Record<string, any> = {
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

const DIVISION_ICONS: Record<string, any> = {
  gaming: <FaGamepad />,
  gaming_creator: <FaGamepad />,
  content: <FaVideo />,
  content_creator: <FaVideo />,
  music: <FaMusic />,
  music_creator: <FaMusic />,
  sport: <FaRunning />,
  sport_creator: <FaRunning />,
  staff: <FaShieldAlt />,
};

const DIVISIONS = ['all', 'gaming', 'music', 'sport', 'content'];

function getYouTubeThumbnail(url: string) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
  }
  return url;
}

export default function CommunityPage() {
  const [featuredCreators, setFeaturedCreators] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [featuredVideoGroups, setFeaturedVideoGroups] = useState<any[]>([]);
  const [latestVideoGroups, setLatestVideoGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchCommunityData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/community')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to retrieve community members.');
        return res.json();
      })
      .then(data => {
        if (data.featuredCreators) setFeaturedCreators(data.featuredCreators);
        if (data.members) setMembers(data.members);
        
        return fetch('/api/community/videos');
      })
      .then(async res => {
        if (res && !res.ok) throw new Error('Failed to retrieve creator broadcasts.');
        return res ? res.json() : null;
      })
      .then(vidData => {
        if (vidData) {
          if (vidData.featuredGroups) setFeaturedVideoGroups(vidData.featuredGroups);
          if (vidData.latestGroups) setLatestVideoGroups(vidData.latestGroups);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch community data:', err);
        setError('Community index could not be loaded due to a connection issue.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const allContent = [...featuredCreators, ...members].flatMap(u => 
    (u.featuredLinks || []).map(link => ({ ...link, user: u }))
  ).sort(() => Math.random() - 0.5); // Randomize content for variety

  const filteredMembers = filter === 'all'
    ? members
    : members.filter(m => m.divisions.includes(filter));

  return (
    <div className={styles.page}>
      <HomeFixedBackground />
      
      <section className={styles.hero}>
        <motion.div 
          className="container"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div className="section-tag" style={{ margin: '0 auto 16px' }}>Network</div>
          <h1 className={styles.heroTitle}>BHL <span className="gradient-text">COMMUNITY</span></h1>
          <p className={styles.heroSub}>
            The heartbeat of the Brotherhood. Meet the creators, artists, and warriors 
            shaping the legacy of BHL.
          </p>
        </motion.div>
      </section>

      {/* Featured Video Carousel (Only if featured creators have videos) */}
      {featuredVideoGroups.length > 0 && (
        <section className={styles.section} style={{ paddingBottom: '32px' }}>
          <div className="container">
            <CreatorVideoCarousel groups={featuredVideoGroups} />
          </div>
        </section>
      )}

      {/* Featured Creators Section */}
      {featuredCreators.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Featured Creators</h2>
                <p className={styles.sectionSubtitle}>Premier talent driving the vision</p>
              </div>
            </div>
            
            <motion.div 
              className={styles.creatorScroll}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
            >
              {featuredCreators.map(creator => (
                <motion.div key={creator._id} variants={fadeUp} className={styles.creatorItem}>
                  <Link href={`/users/${creator._id}`} className={styles.creatorCard}>
                    <div className={styles.cardImage}>
                      {creator.featuredLinks?.[0] ? (
                        <img src={getYouTubeThumbnail(creator.featuredLinks[0].url)} alt={`${creator.username} featured video`} />
                      ) : (
                        <img src={creator.avatar || 'https://placehold.co/600x338/111/white?text=BHL+CREATOR'} alt={`${creator.username} avatar`} />
                      )}
                      <div className={styles.cardOverlay} />
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.divisionBadge}>
                        {creator.divisions && creator.divisions.length > 0 
                          ? (DIVISION_ICONS[creator.divisions[0]] || <FaShieldAlt />)
                          : <FaShieldAlt />}
                      </div>
                      <div className={styles.creatorInfo}>
                        <div className={styles.creatorName}>{creator.username}</div>
                        <div className={styles.creatorSocials}>
                          {Object.entries(PLATFORM_ICONS).map(([key, icon]) => {
                            const url = creator.socialLinks?.[key as keyof SocialLinks];
                            if (!url) return null;
                            return <span key={key} className={styles.miniIcon}>{icon}</span>;
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Latest from the Brotherhood - YouTube Cache */}
      {latestVideoGroups.length > 0 && (
        <section className={styles.section} style={{ paddingTop: 0 }}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Latest from the Brotherhood</h2>
                <p className={styles.sectionSubtitle}>Recent uploads from platform creators</p>
              </div>
            </div>
            
            <CreatorVideoCarousel groups={latestVideoGroups} />
          </div>
        </section>
      )}
      {/* Community Directory Section */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Brotherhood Directory</h2>
              <p className={styles.sectionSubtitle}>Approved platform personnel</p>
            </div>
          </div>

          {/* Tabs */}
          {!error && !loading && (members.length > 0 || featuredCreators.length > 0) && (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeUp}
            >
              <div className={`${styles.tabs} premium-panel selection-pill-group`}>
                {DIVISIONS.map(d => (
                  <button
                    key={d}
                    className={`${styles.tab} selection-pill ${filter === d ? `selection-pill-active ${styles.tabActive}` : ''}`}
                    onClick={() => setFilter(d)}
                  >
                    {d === 'all' ? 'Global' : d.charAt(0).toUpperCase() + d.slice(1)}
                    {filter === d && (
                      <motion.div 
                        layoutId="communityTab"
                        className="selection-pill-indicator"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.emptyState}
              >
                <div className="spinner" style={{ margin: '0 auto 20px' }} />
                <p>Scanning community database...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 0, 0, 0.02)',
                  border: '1px solid rgba(255, 0, 0, 0.08)',
                  borderRadius: '16px',
                  maxWidth: '480px',
                  margin: '2rem auto',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                <h4 style={{ color: '#fff', fontFamily: 'Rajdhani', fontSize: '1.25rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Connection Interrupted</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{error}</p>
                <button className="btn btn-ghost" onClick={fetchCommunityData}>
                  Retry Connection
                </button>
              </motion.div>
            ) : members.length === 0 && featuredCreators.length === 0 ? (
              <motion.div 
                key="empty-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.emptyState}
              >
                <p>The community is currently private. Check back soon for approved member profiles.</p>
              </motion.div>
            ) : filteredMembers.length === 0 ? (
              <motion.div 
                key={`empty-${filter}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.emptyState}
              >
                <p>No members found in the {filter} division. Check back later for updates.</p>
              </motion.div>
            ) : (
              <motion.div 
                key={`grid-${filter}`}
                className={styles.membersGrid}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={staggerContainer}
              >
                {filteredMembers.map(member => (
                  <motion.div 
                    key={member._id} 
                    className={styles.memberCard}
                    variants={fadeUp}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <div className={styles.memberAvatar}>
                      {member.avatar ? <img src={member.avatar} alt={`${member.username} avatar`} /> : member.username[0].toUpperCase()}
                    </div>
                    <div className={styles.memberName}>{member.username}</div>
                    <div className={styles.memberLevel}>
                      Level {calculateLevel(member.xp)} • {getLevelTitle(calculateLevel(member.xp))}
                    </div>
                    
                    <div className={styles.memberDivisions}>
                      {member.divisions.map(div => (
                        <span key={div} className={`division-tag tag-${div}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{div}</span>
                      ))}
                    </div>

                    {member.bio && <p className={styles.memberBio}>{member.bio}</p>}

                    <div className={styles.memberSocials}>
                      {Object.entries(PLATFORM_ICONS).map(([key, icon]) => {
                        const url = member.socialLinks?.[key as keyof SocialLinks];
                        if (!url) return null;
                        return (
                          <a key={key} href={url} target="_blank" rel="noreferrer" className={styles.socialIconBtn} aria-label={key}>
                            {icon}
                          </a>
                        );
                      })}
                    </div>

                    <Link href={`/users/${member._id}`} className={styles.viewProfileBtn}>
                      View Profile
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
