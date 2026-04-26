'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, challenges: 0, products: 0 });

  useEffect(() => {
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
    });
  }, []);

  const statCards = [
    { label: 'Total Members', value: stats.users, icon: '👥', color: '#FF0000' },
    { label: 'Active Challenges', value: stats.challenges, icon: '🏆', color: '#CC0000' },
    { label: 'Products Listed', value: stats.products, icon: '👕', color: '#FFFDBA' },
  ];

  return (
    <div>
      <h1 className={styles.title}>Admin Overview</h1>
      <p className={styles.sub}>Brotherhood Legacy control panel</p>

      <div className={styles.statsGrid}>
        {statCards.map(s => (
          <div key={s.label} className={styles.statCard} style={{ '--card-color': s.color } as React.CSSProperties}>
            <span className={styles.statIcon}>{s.icon}</span>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.quickLinks}>
        <h3>Quick Actions</h3>
        <div className={styles.qGrid}>
          <a href="/admin/challenges" className={styles.qCard} id="admin-quick-challenges">
            <span>🏆</span> Manage Challenges
          </a>
          <a href="/admin/products" className={styles.qCard} id="admin-quick-products">
            <span>👕</span> Manage Products
          </a>
          <a href="/admin/users" className={styles.qCard} id="admin-quick-users">
            <span>👥</span> View Users
          </a>
          <a href="/leaderboard" className={styles.qCard} id="admin-quick-leaderboard">
            <span>📊</span> View Leaderboard
          </a>
        </div>
      </div>
    </div>
  );
}
