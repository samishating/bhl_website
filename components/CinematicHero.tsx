'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, Variants, BezierDefinition } from 'framer-motion';
import styles from './CinematicHero.module.css';

interface CinematicHeroProps {
  statsData: {
    members: number;
    xp: number;
  };
}

const customEase: BezierDefinition = [0.16, 1, 0.3, 1];

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.03,
      duration: 0.5,
      ease: customEase,
    },
  }),
};

function formatHeroStat(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function SplitWord({
  word,
  className,
  delayOffset = 0,
}: {
  word: string;
  className: string;
  delayOffset?: number;
}) {
  return (
    <span className={className} aria-label={word}>
      {word.split('').map((char, i) => (
        <motion.span
          key={i}
          className={styles.letter}
          custom={i + delayOffset}
          initial="hidden"
          animate="visible"
          variants={letterVariants}
          aria-hidden="true"
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export default function CinematicHero({ statsData }: CinematicHeroProps) {
  const logoRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [liveStats, setLiveStats] = useState(statsData);

  // Subscribe to global stats-refresh AND poll every 30 s to keep hero numbers live
  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/stats', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data && data.totalMembers !== undefined) {
            setLiveStats({ members: data.totalMembers, xp: data.totalXP ?? 0 });
          }
        })
        .catch(() => {});
    };

    window.addEventListener('stats-refresh', fetchStats);
    const interval = window.setInterval(fetchStats, 30_000);

    return () => {
      window.removeEventListener('stats-refresh', fetchStats);
      window.clearInterval(interval);
    };
  }, []);

  // Subtle mouse parallax on logo — desktop only
  useEffect(() => {
    const isMobile = window.innerWidth < 900;
    if (isMobile || reduceMotion) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      if (logoRef.current) {
        logoRef.current.style.transform = `translate(${currentX * 8}px, ${currentY * 4}px)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [reduceMotion]);

  return (
    <section className={styles.hero}>
      {/* Background Image */}
      <div className={styles.bgImageWrapper}>
        <Image
          src="/backgrounds/herobackground.png"
          alt=""
          fill
          priority
          quality={100}
          className={styles.bgImage}
        />
      </div>
      {/* bgGlow intentionally removed */}
      <div className={styles.bgNoise} />

      {/* ── Left column: type lockup + CTAs + stats ── */}
      <div className={styles.textBlock}>

        {/* Eyebrow label */}
        <motion.span
          className={styles.eyebrow}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: customEase }}
        >
          Gaming · Music · Sport · Content
        </motion.span>

        {/* BROTHERHOOD LEGACY — the page's one <h1>. display:contents keeps the two
            SplitWord lines as direct flex children of .textBlock (no layout impact)
            while giving the site's primary brand phrase real heading semantics. */}
        <h1 style={{ display: 'contents' }} aria-label="Brotherhood Legacy">
          <SplitWord
            word="Brotherhood"
            className={`${styles.line} ${styles.lineBrotherhood}`}
            delayOffset={0}
          />
          <SplitWord
            word="Legacy"
            className={`${styles.line} ${styles.lineLegacy}`}
            delayOffset={8}
          />
        </h1>

        {/* Subtitle — specific, plain, machine-readable feel */}
        <motion.p
          className={styles.sub}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6, ease: customEase }}
        >
          Four divisions. One ranked community. Apply, earn XP
          across Gaming, Music, Sport &amp; Content — and let your
          name speak for itself on the leaderboard.
        </motion.p>

        {/* CTAs — notched angular buttons */}
        <motion.div
          className={styles.ctas}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6, ease: customEase }}
        >
          <Link href="/register" className={`btn btn-primary btn-lg notch-corner`} id="hero-join-btn">
            Join the Brotherhood
          </Link>
          <Link
            href="/#leaderboard"
            className={`btn btn-secondary btn-lg notch-corner`}
            id="hero-leaderboard-btn"
            onClick={(e) => {
              if (typeof window !== 'undefined' && window.location.pathname === '/') {
                e.preventDefault();
                document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', '/#leaderboard');
              }
            }}
          >
            View Leaderboard
          </Link>
        </motion.div>

        {/* Live stat bar — real data from DB, inline below CTAs */}
        <motion.div
          className={styles.statDock}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.45, ease: customEase }}
        >
          <div className={styles.statCard}>
            <span className="stat-num">{formatHeroStat(liveStats.members)}</span>
            <small>Members</small>
          </div>
          <div className={styles.statCard}>
            <span className="stat-num">{formatHeroStat(liveStats.xp)}</span>
            <small>Total XP</small>
          </div>
          <div className={styles.statCard}>
            <span className="stat-num">4</span>
            <small>Divisions</small>
          </div>
        </motion.div>
      </div>

      {/* ── Right column: dragon logo ── */}
      <motion.div
        className={styles.logoWrap}
        initial={{ opacity: 0, x: 40, scale: 0.94 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <div ref={logoRef} className={styles.parallaxContainer}>
          <Image
            src="/brand/logo.png"
            alt="BHL Brotherhood Legacy"
            width={480}
            height={480}
            className={styles.logo}
            priority
          />
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className={styles.scroll}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
      >
        <div className={styles.scrollLine} />
      </motion.div>
    </section>
  );
}
