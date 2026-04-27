import dynamic from 'next/dynamic';
import Link from 'next/link';
const HeroClient = dynamic(() => import('@/components/HeroClient'), { ssr: true });
import { getGlobalStats } from '@/lib/stats';
import styles from './page.module.css';

const divisions = [
  { id: 'gaming', label: 'Gaming', icon: '🎮', image: '/brand/gaming.png', desc: 'Competitive gaming at the highest level', color: '#FFD700', tag: 'tag-gaming' },
  { id: 'music', label: 'Music', icon: '🎵', image: '/brand/music.png', desc: 'Artists shaping the sound of the future', color: '#A855F7', tag: 'tag-music' },
  { id: 'sport', label: 'Sport', icon: '💪', image: '/brand/sport.png', desc: 'Global sports, fitness & physical excellence', color: '#06B6D4', tag: 'tag-sport' },
  { id: 'content', label: 'Content', icon: '🎬', image: '/brand/logo.png', desc: 'Creators dominating digital culture', color: '#EF4444', tag: 'tag-content' },
];

export const revalidate = 60;
export default async function HomePage() {
  const stats = await getGlobalStats();

  return (
    <>
      {/* HERO (Client Side Canvas + Counters) */}
      <HeroClient statsData={{ members: stats.totalMembers, xp: stats.totalXP }} />

      {/* DIVISIONS PREVIEW (Server Side) */}
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
                style={{ animationDelay: `${i * 0.1}s`, '--div-color': div.color } as any}
                id={`home-division-${div.id}`}
              >
                <div className={styles.divCardGlow} style={{ background: div.color }} />
                  {div.image ? (
                    <img src={div.image} alt={div.label} loading="lazy" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
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

      {/* XP SECTION (Server Side) */}
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

      {/* CTA SECTION (Server Side) */}
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
