'use client';
import { useState, useEffect } from 'react';
import { useAdmin, adminLinks } from './layout';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import styles from './page.module.css';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, challenges: 0, products: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const { setGlobalLoading } = useAdmin();

  useEffect(() => {
    setGlobalLoading(true);
    Promise.all([
      fetch('/api/leaderboard').then(r => r.json()),
      fetch('/api/challenges').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([lb, ch, pr]) => {
      setStats({
        users: lb.users?.length || 0,
        challenges: ch.challenges?.length || 0,
        products: pr.products?.length || 0,
      });
    }).finally(() => {
      setPageLoading(false);
      setGlobalLoading(false);
    });
  }, [setGlobalLoading]);

  if (pageLoading) return null;

  const statCards = [
    { label: 'Total Members', value: stats.users, icon: '/ICONS/USER.svg', color: '#FF0000' },
    { label: 'Active Challenges', value: stats.challenges, icon: '/ICONS/trophy_1.svg', color: '#FF4444' },
    { label: 'Total Products', value: stats.products, icon: '/ICONS/PRODUCTS.svg', color: '#FFFDBA' },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.sub}>Manage platform users, products, and community data</p>
        </div>
      </div>

      <motion.div 
        className={styles.statsGrid}
        variants={staggerContainer}
      >
        {statCards.map(s => (
          <motion.div 
            key={s.label} 
            className={styles.statCard} 
            variants={fadeUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            style={{ '--card-color': s.color } as React.CSSProperties}
          >
            <img src={s.icon} className={styles.statIcon} alt="" />
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className={styles.quickLinks}>
        <h3 className={styles.sectionTitle}>Management</h3>
        <motion.div 
          className={styles.qGrid}
          variants={staggerContainer}
        >
          {adminLinks.filter(l => l.href !== '/admin' && (!l.superOnly || user?.role === 'superadmin')).map(l => (
            <motion.a 
              key={l.href} 
              href={l.href} 
              className={styles.qCard}
              variants={fadeUp}
              whileHover={{ scale: 1.02 }}
            >
              <img src={l.icon} alt="" />
              {l.label}
            </motion.a>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
