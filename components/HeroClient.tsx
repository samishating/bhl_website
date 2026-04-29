'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnimatedCounter from './AnimatedCounter';
import styles from '@/app/(main)/page.module.css';

interface HeroClientProps {
  statsData: {
    members: number;
    xp: number;
  };
}

export default function HeroClient({ statsData: initialStats }: HeroClientProps) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    // Fetch live stats on mount to bypass ISR cache
    const fetchLiveStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats({
            members: data.totalMembers,
            xp: data.totalXP
          });
        }
      } catch (err) {
        console.error('Failed to fetch live stats:', err);
      }
    };
    
    fetchLiveStats();

    // Listen for global refresh events (e.g. after joining a division)
    const handleRefresh = () => fetchLiveStats();
    window.addEventListener('stats-refresh', handleRefresh);
    return () => window.removeEventListener('stats-refresh', handleRefresh);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={`${styles.heroContent} animate-fade-up`}>
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
          <Link href="/register" className="btn btn-primary btn-lg">
            Join the Brotherhood
          </Link>
          <Link href="/#divisions" className="btn btn-secondary btn-lg">
            Explore Divisions
          </Link>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {typeof stats.members === 'number' ? (
                <AnimatedCounter value={stats.members} suffix="+" />
              ) : (
                <div className="skeleton" style={{ width: '80px', height: '2.5rem', margin: '0 auto' }} />
              )}
            </span>
            <span className={styles.statLabel}>Members</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>4</span>
            <span className={styles.statLabel}>Divisions</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {typeof stats.xp === 'number' ? (
                <AnimatedCounter value={stats.xp} suffix="+" />
              ) : (
                <div className="skeleton" style={{ width: '120px', height: '2.5rem', margin: '0 auto' }} />
              )}
            </span>
            <span className={styles.statLabel}>XP Earned</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>∞</span>
            <span className={styles.statLabel}>Potential</span>
          </div>
        </div>
      </div>

    </section>
  );
}
