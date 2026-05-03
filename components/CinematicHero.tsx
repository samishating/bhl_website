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
      // Lerp for smooth lag
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

  return (
    <section className={styles.hero} id="hero">
      {/* Atmospheric background */}
      <div className={styles.bgGlow} ref={glowRef} />
      <div className={styles.bgNoise} />
      <div className={styles.bgLines} />

      {/* Composition: BROTHERHOOD → LOGO → LEGACY stacked */}
      <div className={styles.textBlock}>
        {/* Line 1 */}
        <span className={`${styles.line} ${styles.lineBrotherhood}`}>
          Brotherhood
        </span>

        {/* Rising Logo — sits between the two lines */}
        <div className={styles.logoWrap} ref={logoRef}>
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

        {/* Line 2 */}
        <span className={`${styles.line} ${styles.lineLegacy}`}>
          Legacy
        </span>
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
        <span className={styles.scrollLabel}>Scroll</span>
      </div>
    </section>
  );
}
