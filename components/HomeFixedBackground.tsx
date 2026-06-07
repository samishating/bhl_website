'use client';
import { useEffect, useState } from 'react';
import styles from './HomeFixedBackground.module.css';

export default function HomeFixedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.fixedBackground}>
      {/* Atmospheric layers — no animated particles */}
      <div className={styles.vignette} />
      <div className={styles.ambientHaze} />
      <div className={styles.grainTexture} />
      <div className={styles.structuralLines} />
    </div>
  );
}
