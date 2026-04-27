'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';

const divisions = [
  { id: 'gaming', label: 'Gaming', icon: '🎮', image: '/brand/gaming.png', desc: 'Competitive gaming at the highest level', color: '#FFD700', tag: 'tag-gaming' },
  { id: 'music', label: 'Music', icon: '🎵', image: '/brand/music.png', desc: 'Artists shaping the sound of the future', color: '#A855F7', tag: 'tag-music' },
  { id: 'sport', label: 'Sport', icon: '💪', image: '/brand/sport.png', desc: 'Global sports, fitness & physical excellence', color: '#06B6D4', tag: 'tag-sport' },
  { id: 'content', label: 'Content', icon: '🎬', image: '/brand/logo.png', desc: 'Creators dominating digital culture', color: '#EF4444', tag: 'tag-content' },
];

// Stats are now fetched dynamically

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [statsData, setStatsData] = useState({ members: 0, xp: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStatsData({ members: data.totalMembers, xp: data.totalXP });
        }
      })
      .catch(console.error);
  }, []);

  const stats = [
    { value: `${statsData.members}+`, label: 'Members' },
    { value: '4', label: 'Divisions' },
    { value: statsData.xp >= 1000 ? `${(statsData.xp / 1000).toFixed(1)}K+` : statsData.xp.toString(), label: 'XP Earned' },
    { value: '∞', label: 'Potential' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[] = [];
    const colors = ['#FF0000', '#FFD700', '#A855F7', '#06B6D4'];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, []);

  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroPill}>
            <span className={styles.pillDot} />
            Brotherhood Legacy Platform
          </div>
          <h1 className={styles.heroTitle}>
            <span className="gradient-text">Rise.</span>{' '}
            <span className="gradient-text-red">Compete.</span>{' '}
            <span className={styles.heroWord}>Dominate.</span>
          </h1>
          <p className={styles.heroSub}>
            Join the most elite multi-division community. Earn XP, climb the ranks,
            and leave your legacy across Gaming, Music, Sport & Content.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/register" className="btn btn-primary btn-lg" id="hero-join-btn">
              Join the Brotherhood
            </Link>
            <Link href="/divisions" className="btn btn-secondary btn-lg" id="hero-divisions-btn">
              Explore Divisions
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            {stats.map(s => (
              <div key={s.label} className={styles.stat}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.scrollIndicator}>
          <span>Scroll</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      {/* DIVISIONS PREVIEW */}
      <section className={styles.divisionsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className="section-tag">Our Divisions</div>
            <h2>Choose Your <span className="gradient-text">Path</span></h2>
            <p className={styles.sectionDesc}>
              Four elite divisions. One brotherhood. Find where you belong.
            </p>
          </div>

          <div className={styles.divisionsGrid}>
            {divisions.map((div, i) => (
              <Link
                key={div.id}
                href="/divisions"
                className={styles.divCard}
                style={{ animationDelay: `${i * 0.1}s`, '--div-color': div.color } as React.CSSProperties}
                id={`home-division-${div.id}`}
              >
                <div className={styles.divCardGlow} style={{ background: div.color }} />
                  {div.image ? (
                    <img src={div.image} alt={div.label} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                  ) : (
                    <span className={styles.divIcon}>{div.icon}</span>
                  )}
                <div className={`division-tag ${div.tag}`}>{div.label}</div>
                <p className={styles.divDesc}>{div.desc}</p>
                <span className={styles.divArrow}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* XP SECTION */}
      <section className={styles.xpSection}>
        <div className="container">
          <div className={styles.xpGrid}>
            <div className={styles.xpLeft}>
              <div className="section-tag">Gamification</div>
              <h2>Earn XP. <span className="gradient-text">Level Up.</span></h2>
              <p className={styles.xpDesc}>
                Every action earns you XP. Log in daily, join a division, complete challenges —
                watch your rank soar on the global leaderboard.
              </p>
              <div className={styles.xpActions}>
                {[
                  { icon: '🔥', action: 'Daily Login', xp: '+10 XP' },
                  { icon: '⚔️', action: 'Join Division', xp: '+20 XP' },
                  { icon: '🏆', action: 'Complete Challenge', xp: '+50 XP' },
                ].map(a => (
                  <div key={a.action} className={styles.xpAction}>
                    <span className={styles.xpActionIcon}>{a.icon}</span>
                    <span className={styles.xpActionName}>{a.action}</span>
                    <span className={styles.xpActionXp}>{a.xp}</span>
                  </div>
                ))}
              </div>
              <Link href="/leaderboard" className="btn btn-primary" id="home-leaderboard-btn">
                View Leaderboard
              </Link>
            </div>
            <div className={styles.xpRight}>
              <div className={styles.xpCard}>
                <div className={styles.mockProfile}>
                  <div className={`avatar avatar-lg ${styles.mockAvatar}`}>B</div>
                  <div>
                    <div className={styles.mockName}>BrotherX</div>
                    <div className="badge badge-violet">Champion · Lv.6</div>
                  </div>
                </div>
                <div className={styles.mockXpBar}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>XP Progress</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--neon-blue)' }}>2750 / 4000</span>
                  </div>
                  <div className="xp-bar-container">
                    <div className="xp-bar-fill" style={{ width: '69%' }} />
                  </div>
                </div>
                <div className={styles.mockBadges}>
                  {['FOUNDER', 'RANKED', 'CHALLENGER'].map(b => (
                    <span key={b} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className="container">
          <div className={styles.ctaContent}>
            <h2>Ready to Write Your <span className="gradient-text">Legacy?</span></h2>
            <p>Join hundreds of members already building their story in the Brotherhood.</p>
            <div className={styles.ctaBtns}>
              <Link href="/register" className="btn btn-primary btn-lg" id="home-cta-join-btn">
                Create Account — It's Free
              </Link>
              <Link href="/about" className="btn btn-ghost btn-lg" id="home-cta-about-btn">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
