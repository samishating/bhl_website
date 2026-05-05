'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getLevelTitle, BADGES } from '@/lib/xp';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import styles from './HomeLeaderboard.module.css';

const DIVISIONS = ['all', 'gaming', 'music', 'sport', 'content'];
const divTagClass: Record<string, string> = {
  gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content',
};
const rankIcons = [
  '/ICONS/MEDAL 1.svg',
  '/ICONS/MEDAL 2.svg',
  '/ICONS/MEDAL 3.svg'
];

export default function HomeLeaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const loadLeaderboard = (silent = false) => {
    if (!silent) setLoading(true);
    fetch(`/api/leaderboard?division=${filter}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { 
        setUsers(d.users || []); 
        if (!silent) setLoading(false); 
      });
  };

  useEffect(() => {
    setHasMounted(true);
    loadLeaderboard();
  }, [filter]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleSyncRefresh = () => loadLeaderboard(true);
    window.addEventListener('stats-refresh', handleSyncRefresh);
    return () => window.removeEventListener('stats-refresh', handleSyncRefresh);
  }, [filter]); // Re-bind with current filter context

  return (
    <section id="leaderboard" className="content-band" style={{ borderTop: 'none' }}>
      <div className="section-divider" />
      <div className="content-inner" style={{ paddingTop: '4rem' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
        >
          <div className="section-header">
            <span className="section-tag">Rankings</span>
            <h2>Global <span className="gradient-text">Leaderboard</span></h2>
            <p className="section-desc">Top members ranked by XP across all divisions</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={fadeUp}
        >
          <div className={`${styles.tabs} premium-panel`} ref={tabsRef}>
            {DIVISIONS.map(d => (
              <button
                key={d}
                className={`${styles.tab} ${filter === d ? styles.tabActive : ''}`}
                onClick={() => setFilter(d)}
              >
                {d === 'all' ? 'Global' : d.charAt(0).toUpperCase() + d.slice(1)}
                {filter === d && (
                  <motion.div 
                    layoutId="activeTab"
                    className={styles.indicator}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Podium */}
        <AnimatePresence mode="wait">
          {!loading && users.length >= 3 && (
            <motion.div 
              key={`podium-${filter}`}
              className={styles.podium}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              {[users[1], users[0], users[2]].map((u, idx) => {
                const podiumOrder = [2, 1, 3];
                const rank = podiumOrder[idx];
                const heightPct = rank === 1 ? '100%' : rank === 2 ? '80%' : '65%';
                return (
                  <div key={u._id} className={`${styles.podiumItem} ${rank === 1 ? styles.podiumFirst : ''}`}>
                    <Link href={`/users/${u._id}`} className={`avatar avatar-lg ${styles.podiumAvatar}`}>
                      {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0].toUpperCase()}
                    </Link>
                    <Link href={`/users/${u._id}`} className={styles.podiumName}>{u.username}</Link>
                    <div className={styles.podiumXp}>{u.xp.toLocaleString()} XP</div>
                    <div className={styles.podiumBase} style={{ height: heightPct }}>
                      <span className={styles.podiumRank}>
                        <img src={rankIcons[rank - 1]} alt={`Rank ${rank}`} style={{ width: '40px', height: '40px' }} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className={styles.tableSection}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem 0' }}
              >
                <div className="spinner" />
              </motion.div>
            ) : users.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}
              >
                No members yet in this division.
              </motion.div>
            ) : (
              <motion.div 
                key={`table-${filter}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="table-container premium-panel"
              >
                <div className={styles.gridHeader}>
                  <div>#</div>
                  <div>Member</div>
                  <div>Level</div>
                  <div>Division</div>
                  <div>XP</div>
                </div>
                <div className={styles.gridBody}>
                  {users.map((u, i) => (
                    <div key={u._id} className={`${styles.gridRow} ${i < 3 ? styles.topRow : ''}`}>
                      <div>
                        <span className={styles.rank}>
                          {i < 3 ? (
                            <img src={rankIcons[i]} alt={`Rank ${i+1}`} style={{ width: '24px', height: '24px' }} />
                          ) : (
                            i + 1
                          )}
                        </span>
                      </div>
                      <div>
                        <div className={styles.memberCell}>
                          <Link href={`/users/${u._id}`} className="avatar">
                            {u.avatar ? <img src={u.avatar} alt="" /> : u.username[0]}
                          </Link>
                          <div>
                            <Link href={`/users/${u._id}`} className={styles.memberName}>{u.username}</Link>
                            <div className={styles.memberTitle}>{getLevelTitle(u.level)}</div>
                          </div>
                        </div>
                      </div>
                      <div><span className="badge badge-violet">Lv.{u.level}</span></div>
                      <div>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {u.divisions && u.divisions.length > 0 ? (
                            u.divisions.map((d: string) => (
                              <span key={d} className={`division-tag ${divTagClass[d]}`}>{d}</span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </div>
                      </div>
                      <div><span className={styles.xpValue}>{u.xp.toLocaleString()}</span></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
