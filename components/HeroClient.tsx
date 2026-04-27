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
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
          <Link href="/register" className="btn btn-primary btn-lg">
            Join the Brotherhood
          </Link>
          <Link href="/divisions" className="btn btn-secondary btn-lg">
            Explore Divisions
          </Link>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ minWidth: '80px', display: 'inline-block' }}>
              {statsData.members ? <AnimatedCounter value={statsData.members} suffix="+" /> : '...'}
            </span>
            <span className={styles.statLabel}>Members</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>4</span>
            <span className={styles.statLabel}>Divisions</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ minWidth: '100px', display: 'inline-block' }}>
              {statsData.xp ? <AnimatedCounter value={statsData.xp} suffix="+" /> : '...'}
            </span>
            <span className={styles.statLabel}>XP Earned</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>∞</span>
            <span className={styles.statLabel}>Potential</span>
          </div>
        </div>
      </div>

      <div className={styles.scrollIndicator}>
        <span>Scroll</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}
