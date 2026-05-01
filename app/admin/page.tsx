'use client';
import { useState, useEffect } from 'react';
import { useAdmin, adminLinks } from './layout';
import { useAuth } from '@/contexts/AuthContext';
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
    <div className="animate-fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.sub}>Manage platform users, products, and community data</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map(s => (
          <div key={s.label} className={styles.statCard} style={{ '--card-color': s.color } as React.CSSProperties}>
            <img src={s.icon} className={styles.statIcon} alt="" />
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.quickLinks}>
        <h3 className={styles.sectionTitle}>Management</h3>
        <div className={styles.qGrid}>
          {adminLinks.filter(l => l.href !== '/admin' && (!l.superOnly || user?.role === 'superadmin')).map(l => (
            <a key={l.href} href={l.href} className={styles.qCard}>
              <img src={l.icon} alt="" />
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
