'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { getLevelTitle } from '@/lib/xp';
import { useProgression } from '@/lib/useProgression';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import AnimatedCounter from '@/components/AnimatedCounter';
import { useScrollEdges } from '@/hooks/useScrollEdges';
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
  divisionXp?: Record<string, number>;
}

export default function HomeLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { atStart: tabsAtStart, atEnd: tabsAtEnd } = useScrollEdges(tabsRef);
  const levelTitles = useProgression();
  // The API sorts division-filtered results by divisionXp.<division>, not global xp (a user can
  // rank #1 in Gaming XP while having less total XP than someone below them) -- so the number we
  // display per user must be the same metric it's sorted by, or the order looks "wrong."
  const getDisplayXp = useCallback(
    (u: LeaderboardUser) => (filter === 'all' ? u.xp : u.divisionXp?.[filter] ?? 0),
    [filter]
  );
  const topUser = users[0];
  const totalVisibleXp = users.reduce((sum, user) => sum + getDisplayXp(user), 0);
  // Top-3 cards only render once there are 3+ members (a "top 3" of 1-2 people doesn't make
  // sense). Below that threshold the table must show everyone, or 1-2-member divisions would
  // render nothing at all -- neither the cards (need 3+) nor a rank-4-onward table (nothing left).
  const showTopThree = users.length >= 3;
  const tableUsers = showTopThree ? users.slice(3) : users;
  const tableRankOffset = showTopThree ? 3 : 0;

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
          <div className="section-header" style={{ textAlign: 'left' }}>
            <span className="section-tag">Rankings</span>
            <h2>Global <span className="gradient-text">Leaderboard</span></h2>
            <p className="section-desc" style={{ marginLeft: 0 }}>Top members ranked by XP across all divisions</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={fadeUp}
        >
          <div
            className={`${styles.tabs} ${tabsAtStart ? styles.tabsAtStart : ''} ${tabsAtEnd ? styles.tabsAtEnd : ''}`}
            ref={tabsRef}
          >
            {DIVISIONS.map(d => (
              <button
                key={d}
                className={`${styles.tab} ${filter === d ? styles.tabActive : ''}`}
                onClick={() => {
                  setLoading(true);
                  setFilter(d);
                }}
              >
                {d === 'all' ? 'Global' : d.charAt(0).toUpperCase() + d.slice(1)}
                {filter === d && (
                  <motion.div
                    layoutId="activeTab"
                    className={styles.tabIndicator}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
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
              <strong><AnimatedCounter value={totalVisibleXp} duration={1200} /></strong>
            </div>
            <div>
              <span>Active board</span>
              <strong>{filter === 'all' ? 'Global' : filter}</strong>
            </div>
          </motion.div>
        )}

        {/* Top 3 — equal-height cards, not a stacked podium. More breathing room, one shape. */}
        <AnimatePresence mode="wait">
          {!loading && showTopThree && (
            <motion.div
              key={`top3-${filter}`}
              className={styles.topThree}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.35 }}
            >
              {users.slice(0, 3).map((u, i) => {
                const rank = i + 1;
                const rankClass = rank === 1 ? styles.topCardRank1 : rank === 2 ? styles.topCardRank2 : styles.topCardRank3;
                return (
                  <motion.div
                    key={u._id}
                    className={`${styles.topCard} ${rankClass} ${rank === 1 ? styles.topCardFirst : ''}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <span className={styles.topCardBadge}>
                      <img src={rankIcons[i]} alt={`Rank ${rank}`} style={{ width: '28px', height: '28px' }} />
                    </span>
                    <Link href={`/users/${u._id}`} className={`avatar ${rank === 1 ? 'avatar-xl' : 'avatar-lg'} ${styles.topCardAvatar}`}>
                      {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0].toUpperCase()}
                    </Link>
                    <Link href={`/users/${u._id}`} className={styles.topCardName}>{u.username}</Link>
                    <div className={styles.topCardTitle}>{getLevelTitle(u.level, levelTitles)}</div>
                    <div className={styles.topCardXp}><AnimatedCounter value={getDisplayXp(u)} duration={1000} suffix=" XP" /></div>
                    {u.divisions && u.divisions.length > 0 && (
                      <div className={styles.topCardDivisions}>
                        {u.divisions.map((d: string) => (
                          <span key={d} className={`division-tag ${divTagClass[d]}`}>{d.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
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
            ) : tableUsers.length === 0 ? null : (
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
                  {/* When there are 3+ members, ranks 1-3 already have their own cards above and
                      this table picks up at 4. Below that threshold (1-2 members, no cards shown)
                      it lists everyone so nobody disappears. */}
                  {tableUsers.map((u, idx) => {
                    const i = idx + tableRankOffset;
                    return (
                    <div
                      key={u._id}
                      className={styles.gridRow}
                      style={{ '--xp-fill': `${Math.min(100, Math.max(4, topUser ? (getDisplayXp(u) / Math.max(getDisplayXp(topUser), 1)) * 100 : 4))}%` } as CSSProperties & { '--xp-fill': string }}
                    >
                      <div>
                        <span className={styles.rank}>
                          <span className={styles.rankNum}>{i + 1}</span>
                        </span>
                      </div>
                      <div>
                        <div className={styles.memberCell}>
                          <Link href={`/users/${u._id}`} className="avatar">
                            {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0]}
                          </Link>
                          <div>
                            <Link href={`/users/${u._id}`} className={styles.memberName}>{u.username}</Link>
                            <div className={styles.memberTitle}>{getLevelTitle(u.level, levelTitles)}</div>
                          </div>
                        </div>
                      </div>
                      <div><span className="badge badge-violet">Lv.{u.level}</span></div>
                      <div>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {u.divisions && u.divisions.length > 0 ? (
                            u.divisions.map((d: string) => (
                              <span key={d} className={`division-tag ${divTagClass[d]}`}>{d.replace(/_/g, ' ')}</span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </div>
                      </div>
                      <div><span className={styles.xpValue}><AnimatedCounter value={getDisplayXp(u)} duration={900} /></span></div>
                    </div>
                  );})}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
