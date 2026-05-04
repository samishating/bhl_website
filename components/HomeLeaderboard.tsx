'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getLevelTitle, BADGES } from '@/lib/xp';
import { useScrollReveal } from '@/hooks/useScrollReveal';
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
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const headerRef = useScrollReveal<HTMLDivElement>();
  const contentRef = useScrollReveal<HTMLDivElement>();

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
    if (hasMounted) {
      const activeTab = tabsRef.current?.querySelector(`.${styles.tabActive}`) as HTMLElement;
      if (activeTab) {
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth
        });
      }
    }
  }, [filter, hasMounted]);

  useEffect(() => {
    const handleSyncRefresh = () => loadLeaderboard(true);
    window.addEventListener('stats-refresh', handleSyncRefresh);
    return () => window.removeEventListener('stats-refresh', handleSyncRefresh);
  }, [filter]); // Re-bind with current filter context

  return (
    <section id="leaderboard" className="content-band" style={{ borderTop: 'none' }}>
      <div className="section-divider" />
      <div className="content-inner" style={{ paddingTop: '4rem' }}>
        <div ref={headerRef}>
          <div data-reveal="header" className="section-header">
            <span className="section-tag">Rankings</span>
            <h2>Global <span className="gradient-text">Leaderboard</span></h2>
            <p className="section-desc">Top members ranked by XP across all divisions</p>
          </div>
        </div>

        {/* Tabs */}
        <div ref={contentRef}>
        <div data-reveal className={`${styles.tabs} premium-panel`} ref={tabsRef}>
          {hasMounted && (
            <div 
              className={styles.indicator} 
              style={{ 
                left: `${indicatorStyle.left}px`, 
                width: `${indicatorStyle.width}px` 
              }} 
            />
          )}
          {DIVISIONS.map(d => (
            <button
              key={d}
              className={`${styles.tab} ${filter === d ? styles.tabActive : ''}`}
              onClick={() => setFilter(d)}
            >
              {d === 'all' ? 'Global' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Podium */}
        {!loading && users.length >= 3 && (
          <div className={styles.podium}>
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
          </div>
        )}

        {/* Table */}
        <div className={styles.tableSection}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem 0' }}>
              <div className="spinner" />
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No members yet in this division.</div>
          ) : (
            <div className="table-container premium-panel">
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
            </div>
          )}
        </div>
        </div> {/* close contentRef */}
      </div>
    </section>
  );
}
