'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import AnimatedCounter from '@/components/AnimatedCounter';
import styles from '@/app/(main)/page.module.css';

const divisions = [
  {
    id: 'gaming', label: 'Gaming', icon: '🎮', image: '/brand/gaming.png', color: '#FFFDBA', tag: 'tag-gaming',
    desc: 'Our Gaming division is home to the most competitive gamers in the Brotherhood. We compete across titles like Valorant, League of Legends, FIFA, and more. If you have the skill and the drive to win, this is your home.',
    perks: ['Team scrimmages', 'Tournament entries', 'Coaching sessions', 'Exclusive gaming gear discounts'],
  },
  {
    id: 'music', label: 'Music', icon: '🎵', image: '/brand/music.png', color: '#A855F7', tag: 'tag-music',
    desc: 'The Music division unites producers, artists, and audio engineers under one roof. From trap to electronic, from rap to lo-fi — we push the boundaries of sound and help each other grow as artists.',
    perks: ['Beat sharing sessions', 'Collab opportunities', 'Release promotion', 'Studio tips & resources'],
  },
  {
    id: 'sport', label: 'Sport', icon: '💪', image: '/brand/sport.png', color: '#06B6D4', tag: 'tag-sport',
    desc: 'The Sport division covers everything from intense physical discipline to global sports like Football, F1, and MMA. Stay active, discuss the latest matches, and crush your goals.',
    perks: ['Live match discussions', 'Fitness & nutrition tips', 'Fantasy leagues', 'Workout challenges'],
  },
  {
    id: 'content', label: 'Content', icon: '🎬', image: '/brand/logo.png', color: '#EF4444', tag: 'tag-content',
    desc: 'The Content division is where memes, videos, and viral moments are born. We support streamers, editors, photographers, and memers who want to build their brand and dominate the digital world.',
    perks: ['Cross-promotion', 'Editing resources', 'Content calendars', 'Platform growth tips'],
  },
];

export default function HomeDivisions() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [divisionCounts, setDivisionCounts] = useState<Record<string, number> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [leaders, setLeaders] = useState<Record<string, any> | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // Scroll-reveal refs
  const headerRef = useScrollReveal<HTMLDivElement>();
  const gridRef = useScrollReveal<HTMLDivElement>(true); // stagger cards

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats', { cache: 'no-store' });
      const data = await res.json();
      if (data.divisionCounts) setDivisionCounts(data.divisionCounts);
      if (data.divisionLeaders) setLeaders(data.divisionLeaders);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    fetchStats();
  }, []);

  const handleToggleDivision = async (divId: string) => {
    if (!user) {
      router.push('/login?callbackUrl=/#divisions');
      return;
    }

    setIsProcessing(true);
    const isMember = user.divisions?.includes(divId);
    const newDivisions = isMember
      ? user.divisions.filter(d => d !== divId)
      : [...(user.divisions || []), divId];

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ divisions: newDivisions }),
      });

      if (res.ok) {
        // Parallel refresh of user data and global stats
        await Promise.all([
          refreshUser(),
          fetchStats()
        ]);
        // Trigger global refresh for other components (Leaderboard, Challenges)
        window.dispatchEvent(new Event('stats-refresh'));
        showToast(isMember ? 'Left division' : 'Successfully joined division!', isMember ? 'info' : 'success');
      } else {
        showToast(isMember ? 'Failed to leave division' : 'Failed to join division', 'error');
      }
    } catch (e) {
      showToast('Error updating division', 'error');
    }
    setIsProcessing(false);
  };

  return (
    <section id="divisions" className="content-band">
      <div className="content-inner">
        {/* Header — own reveal element */}
        <div ref={headerRef}>
          <div className={styles.sectionHeader} data-reveal="header">
            <div className="section-tag">Elite Units</div>
            <h2>Our <span className="gradient-text">Divisions</span></h2>
            <p className={styles.sectionDesc}>
              Join a specialized unit. Compete for your colors. Rise to the top of your field.
            </p>
          </div>
        </div>

        {/* Cards grid — staggered reveal */}
        <div className={styles.divisionsGrid} ref={gridRef}>
          {divisions.map((div) => {
            const isMember = user?.divisions?.includes(div.id);
            const count = divisionCounts?.[div.id];
            return (
              <div
                key={div.id}
                data-reveal
                className={`${styles.divCard} ${styles.homeDivCard}`}
                style={{ '--div-color': div.color } as any}
                id={`home-division-${div.id}`}
              >
                <div className={styles.divCardGlow} />
                <div className={styles.divCardTop}>
                  {div.image ? (
                    <img src={div.image} alt={div.label} style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                  ) : (
                    <span className={styles.divIcon}>{div.icon}</span>
                  )}
                  <div>
                    <div className={`division-tag ${div.tag}`}>{div.label}</div>
                    <div className={styles.memberCount}>
                      {count !== undefined
                        ? <><AnimatedCounter value={count} /> members</>
                        : <span className="skeleton" style={{ display: 'inline-block', width: '70px', height: '14px' }} />}
                    </div>
                  </div>
                </div>

                <p className={styles.divDesc}>{div.desc}</p>

                {/* Leader — skeleton while loading, nothing if no leader */}
                <div className={styles.divLeader}>
                  <div className={styles.perksTitle}>Division Leader</div>
                  {leaders === null ? (
                    /* Still loading */
                    <div className={styles.leaderRow}>
                      <span className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'block', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <span className="skeleton" style={{ display: 'block', width: '80px', height: '14px' }} />
                        <span className="skeleton" style={{ display: 'block', width: '50px', height: '11px' }} />
                      </div>
                    </div>
                  ) : leaders[div.id] ? (
                    <div className={styles.leaderRow}>
                      <div className="avatar" style={{ width: '32px', height: '32px' }}>
                        {leaders[div.id].avatar
                          ? <img src={leaders[div.id].avatar} alt="" />
                          : leaders[div.id].username[0]}
                      </div>
                      <div className={styles.leaderInfo}>
                        <span className={styles.leaderName}>{leaders[div.id].username}</span>
                        <span className={styles.leaderXp}>{leaders[div.id].xp.toLocaleString()} XP</span>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No leader yet</span>
                  )}
                </div>

                <div className={styles.divPerks}>
                  {div.perks.map(p => (
                    <div key={p} className={styles.perk}>
                      <span className={styles.perkBullet}>✓</span> {p}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleToggleDivision(div.id)}
                  disabled={hasMounted ? (isProcessing || divisionCounts === null) : undefined}
                  className={`${styles.joinBtn} ${isMember ? styles.leaveBtn : ''}`}
                >
                  {isProcessing || divisionCounts === null
                    ? <span className="spinner" />
                    : isMember ? `Leave ${div.label}` : `Join ${div.label}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
