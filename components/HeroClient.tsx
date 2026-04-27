'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import AnimatedCounter from './AnimatedCounter';
import styles from '@/app/(main)/page.module.css';

interface HeroClientProps {
  statsData: {
    members: number;
    xp: number;
  };
}

export default function HeroClient({ statsData }: HeroClientProps) {
  return (
    <section className={styles.hero}>
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
              {typeof statsData.members === 'number' ? <AnimatedCounter value={statsData.members} suffix="+" /> : '...'}
            </span>
            <span className={styles.statLabel}>Members</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>4</span>
            <span className={styles.statLabel}>Divisions</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {typeof statsData.xp === 'number' ? <AnimatedCounter value={statsData.xp} suffix="+" /> : '...'}
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
