'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants, BezierDefinition } from 'framer-motion';
import styles from './CinematicHero.module.css';

interface CinematicHeroProps {
  statsData: {
    members: number;
    xp: number;
  };
}

const customEase: BezierDefinition = [0.215, 0.61, 0.355, 1];

const letterVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.05,
      duration: 0.8,
      ease: customEase,
    },
  }),
};

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

export default function CinematicHero({ statsData: _statsData }: CinematicHeroProps) {
  const logoRef = useRef<HTMLDivElement>(null);

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

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Snap scroll logic: when scrolling past 400px, smoothly slide the Divisions card up
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;

    let isAutoScrolling = false;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (isAutoScrolling) {
        lastScrollY = window.scrollY;
        return;
      }

      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const triggerPoint = 400; // user requested 400px threshold

      // If scrolling down past threshold but still in hero space -> snap to divisions
      if (scrollingDown && currentScrollY > triggerPoint && currentScrollY < window.innerHeight - 50) {
        isAutoScrolling = true;
        document.getElementById('divisions')?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => { isAutoScrolling = false; }, 800);
      }
      // If scrolling up from divisions into hero space -> snap back to top
      else if (!scrollingDown && currentScrollY < window.innerHeight - 50 && currentScrollY > 100) {
        isAutoScrolling = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { isAutoScrolling = false; }, 800);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

      {/* Composition: BROTHERHOOD → LOGO → LEGACY */}
      <div className={styles.textBlock}>

        {/* Line 1 — letter-by-letter */}
        <SplitWord
          word="Brotherhood"
          className={`${styles.line} ${styles.lineBrotherhood}`}
          delayOffset={6} // Start after a short initial pause
        />

        {/* Rising Logo */}
        <motion.div
          className={styles.logoWrap}
          ref={logoRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
          }}
          transition={{ 
            delay: 1.2, 
            duration: 1.2, 
            ease: [0.16, 1, 0.3, 1] 
          }}
        >
          <Image
            src="/brand/logo.png"
            alt="BHL"
            width={220}
            height={220}
            className={styles.logo}
            priority
          />
          <motion.div 
            className={styles.logoGlow} 
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>

        {/* Line 2 — letter-by-letter */}
        <SplitWord
          word="Legacy"
          className={`${styles.line} ${styles.lineLegacy}`}
          delayOffset={20} // Start after Brotherhood and Logo have progress
        />
      </div>

      {/* Subtitle */}
      <motion.p 
        className={styles.sub}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
      >
        Rise. Compete. Dominate.
      </motion.p>

      {/* CTAs */}
      <motion.div 
        className={styles.ctas}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
      >
        <Link href="/register" className="btn btn-primary btn-lg" id="hero-join-btn">
          Join the Brotherhood
        </Link>
        <Link href="/#divisions" className="btn btn-secondary btn-lg" id="hero-explore-btn" onClick={(e) => {
          if (typeof window !== 'undefined' && window.location.pathname === '/') {
            e.preventDefault();
            document.getElementById('divisions')?.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState(null, '', '/#divisions');
          }
        }}>
          Explore Divisions
        </Link>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div 
        className={styles.scroll}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
      >
        <div className={styles.scrollLine} />
      </motion.div>
    </section>
  );
}
