'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import HomeFixedBackground from '@/components/HomeFixedBackground';
import styles from './page.module.css';

interface SocialLinks {
  twitter?: string;
  youtube?: string;
  twitch?: string;
  instagram?: string;
  discord?: string;
}

interface User {
  _id: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  divisions: string[];
  socialLinks?: SocialLinks;
  featuredLinks?: { title: string; url: string }[];
}

function getYouTubeThumbnail(url: string) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
  }
  return url; // Return original if not YouTube
}

export default function CommunityPage() {
  const [featuredCreators, setFeaturedCreators] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community')
      .then(res => res.json())
      .then(data => {
        if (data.featuredCreators) setFeaturedCreators(data.featuredCreators);
        if (data.members) setMembers(data.members);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch community data:', err);
        setLoading(false);
      });
  }, []);

  const allContent = [...featuredCreators, ...members].flatMap(u => 
    (u.featuredLinks || []).map(link => ({ ...link, user: u }))
  );

  return (
    <div className={styles.page}>
      <HomeFixedBackground />
      
      {/* Community Hero */}
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
                    <div className={styles.creatorAvatar}>
                      {creator.avatar ? <img src={creator.avatar} alt={creator.username} /> : creator.username[0]}
                    </div>
                    <div className={styles.creatorInfo}>
                      <div className={styles.creatorName}>{creator.username}</div>
                      <div className={styles.creatorRole}>Featured Member</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Content Section */}
      {allContent.length > 0 && (
        <section className={styles.section} style={{ paddingTop: 0 }}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Recent Content</h2>
                <p className={styles.sectionSubtitle}>Latest updates from the network</p>
              </div>
            </div>
            
            <div className={styles.contentGrid}>
              {allContent.slice(0, 6).map((content, idx) => (
                <div key={idx} className={styles.contentCard}>
                  <div className={styles.contentThumb}>
                    <img src={getYouTubeThumbnail(content.url)} alt={content.title} />
                    <div className={styles.playOverlay}>
                      <div className={styles.playIcon}>▶</div>
                    </div>
                  </div>
                  <div className={styles.contentMeta}>
                    <div className={styles.contentAvatar}>
                      {content.user.avatar ? <img src={content.user.avatar} alt="" /> : content.user.username[0]}
                    </div>
                    <div className={styles.contentText}>
                      <div className={styles.contentTitle}>{content.title || 'Untitled Content'}</div>
                      <div className={styles.contentAuthor}>{content.user.username}</div>
                    </div>
                  </div>
                  <a href={content.url} target="_blank" rel="noreferrer" className={styles.fullLink} />
                </div>
              ))}
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
                <Link href={`/users/${member._id}`} key={member._id} className={styles.memberCard}>
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

                  <div className={styles.memberSocials}>
                    {member.socialLinks?.twitter && <span className={styles.socialIcon} title="Twitter">TW</span>}
                    {member.socialLinks?.youtube && <span className={styles.socialIcon} title="YouTube">YT</span>}
                    {member.socialLinks?.twitch && <span className={styles.socialIcon} title="Twitch">TC</span>}
                    {member.socialLinks?.instagram && <span className={styles.socialIcon} title="Instagram">IG</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
