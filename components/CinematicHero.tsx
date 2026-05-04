'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './CinematicHero.module.css';

interface CinematicHeroProps {
  statsData: {
    members: number;
    xp: number;
  };
}

// Splits a word into individual letter spans with staggered animation delays
function SplitWord({
  word,
  className,
  baseDelay,        // seconds — when the first letter starts
  letterDelay = 0.055, // seconds between each letter
}: {
  word: string;
  className: string;
  baseDelay: number;
  letterDelay?: number;
}) {
  return (
    <span className={className} aria-label={word}>
      {word.split('').map((char, i) => (
        <span
          key={i}
          className={styles.letter}
          style={{ animationDelay: `${baseDelay + i * letterDelay}s` }}
          aria-hidden="true"
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export default function CinematicHero({ statsData: _statsData }: CinematicHeroProps) {
  const logoRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // Subtle mouse parallax — desktop only
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

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
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${currentX * 18}px, ${currentY * 8}px)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // "BROTHERHOOD" = 12 letters × 0.055s = ~0.66s duration
  // Logo starts after brotherhood finishes animating (0.3 + 0.66 = ~1.0s)
  // "LEGACY" starts shortly after logo begins (1.1s)
  const brotherhoodStart = 0.3;
  const brotherhoodLetters = 'Brotherhood'.length;
  const letterDelay = 0.055;
  const logoStart = brotherhoodStart + brotherhoodLetters * letterDelay + 0.05;
  const legacyStart = logoStart + 0.15;

  return (
    <section className={styles.hero}>
      {/* Atmospheric background */}
      <div className={styles.bgGlow} ref={glowRef} />
      <div className={styles.bgNoise} />
      <div className={styles.bgLines} />

      {/* Composition: BROTHERHOOD → LOGO → LEGACY */}
      <div className={styles.textBlock}>

        {/* Line 1 — letter-by-letter */}
        <SplitWord
          word="Brotherhood"
          className={`${styles.line} ${styles.lineBrotherhood}`}
          baseDelay={brotherhoodStart}
          letterDelay={letterDelay}
        />

        {/* Rising Logo */}
        <div
          className={styles.logoWrap}
          ref={logoRef}
          style={{ animationDelay: `${logoStart}s, ${logoStart + 1.1}s` }}
        >
          <Image
            src="/brand/logo.webp"
            alt="BHL"
            width={220}
            height={220}
            className={styles.logo}
            priority
          />
          <div className={styles.logoGlow} />
        </div>

        {/* Line 2 — letter-by-letter */}
        <SplitWord
          word="Legacy"
          className={`${styles.line} ${styles.lineLegacy}`}
          baseDelay={legacyStart}
          letterDelay={letterDelay}
        />
      </div>

      {/* Subtitle */}
      <p className={styles.sub}>Rise. Compete. Dominate.</p>

      {/* CTAs */}
      <div className={styles.ctas}>
        <Link href="/register" className="btn btn-primary btn-lg" id="hero-join-btn">
          Join the Brotherhood
        </Link>
        <Link href="/#divisions" className="btn btn-secondary btn-lg" id="hero-explore-btn">
          Explore Divisions
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scroll}>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}
