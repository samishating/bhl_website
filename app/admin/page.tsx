'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from './layout';
import styles from './page.module.css';

export default function AdminPage() {
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
    { label: 'Armory Assets', value: stats.products, icon: '/ICONS/PRODUCTS.svg', color: '#FFFDBA' },
  ];

  return (
    <div className="animate-fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Command Center</h1>
          <p className={styles.sub}>High-level synchronization of brotherhood operations</p>
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
        <h3 className={styles.sectionTitle}>Tactical Operations</h3>
        <div className={styles.qGrid}>
          <a href="/admin/users" className={styles.qCard}>
            <img src="/ICONS/USER.svg" alt="" />
            Member Directory
          </a>
          <a href="/admin/challenges" className={styles.qCard}>
            <img src="/ICONS/trophy_1.svg" alt="" />
            Combat Challenges
          </a>
          <a href="/admin/submissions" className={styles.qCard}>
            <img src="/ICONS/INBOX.svg" alt="" />
            Submission Inbox
          </a>
          <a href="/admin/applications" className={styles.qCard}>
            <img src="/ICONS/INBOX.svg" alt="" />
            Recruitment Desk
          </a>
          <a href="/admin/products" className={styles.qCard}>
            <img src="/ICONS/PRODUCTS.svg" alt="" />
            Armory Management
          </a>
          <a href="/admin/orders" className={styles.qCard}>
            <img src="/ICONS/LIST PRODUCTS.svg" alt="" />
            Supply Orders
          </a>
        </div>
      </div>
    </div>
  );
}
