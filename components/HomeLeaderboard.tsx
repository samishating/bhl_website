'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getLevelTitle } from '@/lib/xp';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import styles from './HomeLeaderboard.module.css';

const DIVISIONS = ['all', 'gaming', 'music', 'sport', 'content'];
const divTagClass: Record<string, string> = {
  gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content',
  gaming_creator: 'tag-gaming_creator', music_creator: 'tag-music_creator', 
  sport_creator: 'tag-sport_creator', content_creator: 'tag-content_creator',
};
const rankIcons = [
  '/ICONS/MEDAL 1.svg',
  '/ICONS/MEDAL 2.svg',
  '/ICONS/MEDAL 3.svg'
];

interface LeaderboardUser {
  _id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  divisions: string[];
}

export default function HomeLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const topUser = users[0];
  const totalVisibleXp = users.reduce((sum, user) => sum + user.xp, 0);

  const fetchLeaderboard = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/leaderboard?division=${filter}`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error('Failed to retrieve leaderboard standings.');
        return r.json();
      })
      .then(d => {
        setUsers((d.users as LeaderboardUser[]) || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Standings could not be loaded due to a connection issue.');
        setLoading(false);
      });
  }, [filter]);

  useEffect(() => {
    const timer = window.setTimeout(fetchLeaderboard, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLeaderboard]);

  useEffect(() => {
    const handleSyncRefresh = () => {
      fetch(`/api/leaderboard?division=${filter}`, { cache: 'no-store' })
        .then(r => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then(d => {
          setUsers((d.users as LeaderboardUser[]) || []);
          setError(null);
        })
        .catch(() => {});
    };
    window.addEventListener('stats-refresh', handleSyncRefresh);
    return () => window.removeEventListener('stats-refresh', handleSyncRefresh);
  }, [filter]);

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
          <div className={`${styles.tabs} premium-panel selection-pill-group`} ref={tabsRef}>
            {DIVISIONS.map(d => (
              <button
                key={d}
                className={`${styles.tab} selection-pill ${filter === d ? `selection-pill-active ${styles.tabActive}` : ''}`}
                onClick={() => {
                  setLoading(true);
                  setFilter(d);
                }}
              >
                {d === 'all' ? 'Global' : d.charAt(0).toUpperCase() + d.slice(1)}
                {filter === d && (
                  <motion.div 
                    layoutId="activeTab"
                    className="selection-pill-indicator"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {!loading && users.length > 0 && (
          <motion.div
            className={styles.rankPulse}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32 }}
          >
            <div>
              <span>Current leader</span>
              <strong>{topUser?.username}</strong>
            </div>
            <div>
              <span>Visible XP</span>
              <strong>{totalVisibleXp.toLocaleString()}</strong>
            </div>
            <div>
              <span>Active board</span>
              <strong>{filter === 'all' ? 'Global' : filter}</strong>
            </div>
          </motion.div>
        )}

        {/* Podium */}
        <AnimatePresence mode="wait">
          {!loading && users.length >= 3 && (
            <motion.div 
              key={`podium-${filter}`}
              className={styles.podium}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
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
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 0, 0, 0.02)',
                  border: '1px solid rgba(255, 0, 0, 0.08)',
                  borderRadius: '16px',
                  maxWidth: '480px',
                  margin: '2rem auto',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                <h4 style={{ color: '#fff', fontFamily: 'Rajdhani', fontSize: '1.25rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Connection Interrupted</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{error}</p>
                <button className="btn btn-ghost" onClick={fetchLeaderboard}>
                  Retry Connection
                </button>
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
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
                    <motion.div
                      key={u._id}
                      className={`${styles.gridRow} ${i < 3 ? styles.topRow : ''}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.28 }}
                    >
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
                            {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0]}
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
                      <span className={styles.rowCharge} style={{ width: `${Math.min(100, Math.max(8, topUser ? (u.xp / Math.max(topUser.xp, 1)) * 100 : 8))}%` }} />
                    </motion.div>
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
