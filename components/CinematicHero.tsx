'use client';
import { useEffect, useRef } from 'react';
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

  // Subtle mouse parallax — desktop only
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
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
        logoRef.current.style.transform = `translate(${currentX * 10}px, ${currentY * 5}px)`;
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
      <div className={styles.bgGlow} />
      <div className={styles.bgNoise} />

      {/* Live stat dock — real data from DB */}
      <motion.div
        className={styles.statDock}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.05, duration: 0.45, ease: customEase }}
      >
        <div className={styles.statCard}>
          <span>{formatHeroStat(statsData.members)}</span>
          <small>Members</small>
        </div>
        <div className={styles.statCard}>
          <span>{formatHeroStat(statsData.xp)}</span>
          <small>Total XP</small>
        </div>
        <div className={styles.statCard}>
          <span>4</span>
          <small>Divisions</small>
        </div>
      </motion.div>

      {/* Composition: BROTHERHOOD → LOGO → LEGACY */}
      <div className={styles.textBlock}>

        {/* Line 1 — letter-by-letter */}
        <SplitWord
          word="Brotherhood"
          className={`${styles.line} ${styles.lineBrotherhood}`}
          delayOffset={0}
        />

        {/* Logo — static, parallax only via mouse move */}
        <motion.div
          className={styles.logoWrap}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div ref={logoRef} className={styles.parallaxContainer}>
            <Image
              src="/brand/logo.png"
              alt="BHL"
              width={220}
              height={220}
              className={styles.logo}
              priority
            />
          </div>
        </motion.div>

        {/* Line 2 — letter-by-letter */}
        <SplitWord
          word="Legacy"
          className={`${styles.line} ${styles.lineLegacy}`}
          delayOffset={8}
        />
      </div>

      {/* Subtitle — specific product description */}
      <motion.p
        className={styles.sub}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Members apply, join divisions, earn XP, and compete — managed through one platform.
      </motion.p>

      {/* CTAs */}
      <motion.div
        className={styles.ctas}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link href="/register" className="btn btn-primary btn-lg" id="hero-join-btn">
          Join the Brotherhood
        </Link>
        <Link
          href="/#leaderboard"
          className="btn btn-secondary btn-lg"
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

      {/* Scroll indicator */}
      <motion.div
        className={styles.scroll}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <div className={styles.scrollLine} />
      </motion.div>
    </section>
  );
}
