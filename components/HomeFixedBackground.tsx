'use client';
import { useEffect, useState, useMemo } from 'react';
import styles from './HomeFixedBackground.module.css';

export default function HomeFixedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate a stable set of random properties for dust particles
  const dustParticles = useMemo(() => {
    const particles = [];
    for (let i = 0; i < 25; i++) {
      particles.push({
        id: i,
        left: `${Math.random() * 100}vw`,
        size: `${Math.random() * 2 + 1}px`,
        duration: `${Math.random() * 25 + 15}s`,
        delay: `${Math.random() * -30}s`,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }
    return particles;
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.fixedBackground}>
      {/* Visual Layers */}
      <div className={styles.vignette} />
      <div className={styles.ambientHaze} />
      <div className={styles.grainTexture} />
      <div className={styles.structuralLines} />

      {/* Drifting Dust Particles */}
      <div className={styles.dustContainer}>
        {dustParticles.map((p) => (
          <div
            key={p.id}
            className={styles.dustParticle}
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
