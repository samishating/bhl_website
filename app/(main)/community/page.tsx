'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import HomeFixedBackground from '@/components/HomeFixedBackground';
import styles from './page.module.css';
import { 
  FaYoutube, FaTwitch, FaInstagram, FaTiktok, FaSpotify, 
  FaApple, FaSoundcloud, FaDiscord, FaGlobe,
  FaGamepad, FaVideo, FaMusic, FaRunning, FaShieldAlt
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

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
  content: <FaVideo />,
  music: <FaMusic />,
  sport: <FaRunning />,
  staff: <FaShieldAlt />,
};

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
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community')
      .then(res => res.json())
      .then(data => {
        if (data.featuredCreators) setFeaturedCreators(data.featuredCreators);
        if (data.members) setMembers(data.members);
        
        // Also fetch videos parallelly
        fetch('/api/community/videos?limit=5')
          .then(res => res.json())
          .then(vidData => {
            if (Array.isArray(vidData)) setVideos(vidData);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(err => {
        console.error('Failed to fetch community data:', err);
        setLoading(false);
      });
  }, []);

  const allContent = [...featuredCreators, ...members].flatMap(u => 
    (u.featuredLinks || []).map(link => ({ ...link, user: u }))
  ).sort(() => Math.random() - 0.5); // Randomize content for variety

  return (
    <div className={styles.page}>
      <HomeFixedBackground />
      
      <section className={styles.hero}>
        <div className="container animate-fade-up">
          <div className="section-tag" style={{ margin: '0 auto 16px' }}>Network</div>
          <h1 className={styles.heroTitle}>BHL <span className="gradient-text">COMMUNITY</span></h1>
          <p className={styles.heroSub}>
            The heartbeat of the Brotherhood. Meet the creators, artists, and warriors 
            shaping the legacy of BHL.
          </p>
        </div>
      </section>

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
            
            <div className={styles.creatorScroll}>
              {featuredCreators.map(creator => (
                <Link href={`/users/${creator._id}`} key={creator._id} className={styles.creatorCard}>
                  <div className={styles.cardImage}>
                    {creator.featuredLinks?.[0] ? (
                      <img src={getYouTubeThumbnail(creator.featuredLinks[0].url)} alt="" />
                    ) : (
                      <img src={creator.avatar || 'https://placehold.co/600x338/111/white?text=BHL+CREATOR'} alt="" />
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
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest from the Brotherhood - YouTube Cache */}
      {videos.length > 0 && (
        <section className={styles.section} style={{ paddingTop: 0 }}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Latest from the Brotherhood</h2>
                <p className={styles.sectionSubtitle}>Recent uploads from platform creators</p>
              </div>
            </div>
            
            <div className={styles.videoCarouselLayout}>
              {/* Featured Large Card (First Video) */}
              <a href={videos[0].videoUrl} target="_blank" rel="noreferrer" className={styles.videoFeatured}>
                <img src={videos[0].thumbnailUrl} alt={videos[0].title} />
                <div className={styles.videoFeaturedOverlay}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <div className={styles.contentAvatar} style={{ width: '48px', height: '48px', fontSize: '1rem', border: '2px solid var(--brand-red)' }}>
                      {videos[0].creator?.avatar ? <img src={videos[0].creator.avatar} alt="" /> : videos[0].creator?.username?.[0] || '?'}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700 }}>{videos[0].creator?.creatorDisplayName || videos[0].creator?.username || 'Unknown Creator'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <FaYoutube style={{ color: '#ff0000', fontSize: '1rem' }} />
                        {new Date(videos[0].publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={styles.videoFeaturedTitle}>{videos[0].title}</div>
                </div>
              </a>

              {/* Grid of Remaining Videos (Up to 4) */}
              <div className={styles.videoGrid}>
                {videos.slice(1, 5).map((v, idx) => (
                  <div key={idx} className={styles.contentCard} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.contentThumb}>
                      <img src={v.thumbnailUrl} alt={v.title} />
                      <div className={styles.playOverlay}>
                        <div className={styles.playIcon} style={{ width: '40px', height: '40px', fontSize: '1rem' }}>▶</div>
                      </div>
                    </div>
                    <div className={styles.contentMeta} style={{ flex: 1 }}>
                      <div className={styles.contentAvatar}>
                        {v.creator?.avatar ? <img src={v.creator.avatar} alt="" /> : v.creator?.username?.[0] || '?'}
                      </div>
                      <div className={styles.contentText}>
                        <div className={styles.contentTitle}>{v.title}</div>
                        <div className={styles.contentAuthor} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <FaYoutube style={{ color: '#ff0000' }} />
                          {v.creator?.creatorDisplayName || v.creator?.username}
                        </div>
                      </div>
                    </div>
                    <a href={v.videoUrl} target="_blank" rel="noreferrer" className={styles.fullLink} />
                  </div>
                ))}
              </div>
            </div>
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

          {loading ? (
            <div className={styles.emptyState}>
              <div className="spinner" style={{ margin: '0 auto 20px' }} />
              <p>Scanning community database...</p>
            </div>
          ) : members.length === 0 && featuredCreators.length === 0 ? (
            <div className={styles.emptyState}>
              <p>The community is currently private. Check back soon for approved member profiles.</p>
            </div>
          ) : (
            <div className={styles.membersGrid}>
              {members.map(member => (
                <div key={member._id} className={styles.memberCard}>
                  <div className={styles.memberAvatar}>
                    {member.avatar ? <img src={member.avatar} alt={member.username} /> : member.username[0].toUpperCase()}
                  </div>
                  <div className={styles.memberName}>{member.username}</div>
                  <div className={styles.memberLevel}>Level {member.level}</div>
                  
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
