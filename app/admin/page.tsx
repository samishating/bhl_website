'use client';
import { useState, useEffect } from 'react';
import { useAdmin, adminLinks } from './layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { RefreshCw } from 'lucide-react';
import styles from './page.module.css';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, challenges: 0, products: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const { setGlobalLoading } = useAdmin();
  const { showToast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

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
      className={styles.container}
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

      <div className={styles.quickLinksSection}>
        <h3 className={styles.sectionTitle}>System Management</h3>
        <div className={styles.qGrid}>
          <button 
            className={`${styles.qCard} ${syncing ? styles.disabled : ''}`} 
            onClick={async () => {
              if (syncing) return;
              setSyncing(true);
              setSyncResult(null);
              try {
                // Call the dedicated admin sync API instead of the cron endpoint
                const res = await fetch('/api/admin/youtube/sync', {
                  method: 'POST'
                });
                const data = await res.json();
                setSyncResult(data);
                if (data.success) {
                  showToast(`Sync Complete: ${data.creatorsSynced} creators, ${data.videosFetched} videos`, 'success');
                } else {
                  showToast(`Sync Failed: ${data.error || 'Unknown error'}`, 'error');
                }
              } catch (err) {
                showToast('Failed to trigger sync. Check console.', 'error');
                console.error(err);
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
          >
            <div className={styles.qCardIcon}>
              <RefreshCw className={syncing ? styles.spinner : ''} size={20} />
            </div>
            <span className={styles.qCardText}>
              {syncing ? 'Syncing...' : 'Sync YouTube Videos'}
            </span>
          </button>
        </div>
      </div>

      <div className={styles.quickLinksSection}>
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
              <div className={styles.qCardIcon}>
                <img src={l.icon} alt="" />
              </div>
              <span className={styles.qCardText}>{l.label}</span>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
