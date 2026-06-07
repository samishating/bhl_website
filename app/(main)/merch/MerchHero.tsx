'use client';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import styles from './page.module.css';

export default function MerchHero() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroBg} aria-hidden="true" />
      <div className={styles.heroVisualZone} aria-hidden="true" />

      <motion.div 
        className={styles.heroTextContainer}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.span className={styles.heroTechTag} variants={fadeUp}>Official BHL Collection</motion.span>

        <h1 className={styles.heroTitleBlock}>
          <motion.span className={styles.titleBHL} variants={fadeUp}>BHL</motion.span>
          <motion.span className={styles.titleMerch} variants={fadeUp}>
            MERCH
          </motion.span>
        </h1>

        <motion.p className={styles.heroSub} variants={fadeUp}>
          Apparel and gear for BHL members and supporters.
        </motion.p>
      </motion.div>
    </section>
  );
}
