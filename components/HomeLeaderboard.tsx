'use client';
import { useState, useEffect } from 'react';
import { getLevelTitle, BADGES } from '@/lib/xp';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from '@/app/(main)/leaderboard/page.module.css';

const DIVISIONS = ['all', 'gaming', 'music', 'sport', 'content'];
const divTagClass: Record<string, string> = {
  gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content',
};
const rankIcons = ['🥇', '🥈', '🥉'];

export default function HomeLeaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const headerRef = useScrollReveal<HTMLDivElement>();
  const contentRef = useScrollReveal<HTMLDivElement>();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?division=${filter}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); });
  }, [filter]);

  return (
    <section id="leaderboard" className="content-band" style={{ borderTop: 'none' }}>
      <div className="content-inner">
        <div ref={headerRef}>
          <div data-reveal="header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-tag">Rankings</div>
            <h2>Global <span className="gradient-text">Leaderboard</span></h2>
            <p style={{ color: 'var(--text-secondary)' }}>Top members ranked by XP across all divisions</p>
          </div>
        </div>

        {/* Tabs */}
        <div ref={contentRef}>
        <div data-reveal className={styles.tabs} style={{ justifyContent: 'center', marginBottom: '4rem' }}>
          {DIVISIONS.map(d => (
            <button
              key={d}
              className={`${styles.tab} ${filter === d ? styles.tabActive : ''}`}
              onClick={() => setFilter(d)}
            >
              {d === 'all' ? '🌐 Global' : d.charAt(0).toUpperCase() + d.slice(1)}
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
                  <div className={`avatar avatar-lg ${styles.podiumAvatar}`}>
                    {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0].toUpperCase()}
                  </div>
                  <span className={styles.podiumName}>{u.username}</span>
                  <div className={styles.podiumXp}>{u.xp.toLocaleString()} XP</div>
                  <div className={styles.podiumBase} style={{ height: heightPct }}>
                    <span className={styles.podiumRank}>{rankIcons[rank - 1]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className={styles.tableSection}>
          {loading ? (
            <div className={styles.loadingState}><div className="spinner" /></div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No members yet in this division.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Member</th>
                    <th>Level</th>
                    <th>Division</th>
                    <th>XP</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} className={i < 3 ? styles.topRow : ''}>
                      <td><span className={styles.rank}>{i < 3 ? rankIcons[i] : i + 1}</span></td>
                      <td>
                        <div className={styles.memberCell}>
                          <div className="avatar">
                            {u.avatar ? <img src={u.avatar} alt="" /> : u.username[0]}
                          </div>
                          <div>
                            <span className={styles.memberName}>{u.username}</span>
                            <div className={styles.memberTitle}>{getLevelTitle(u.level)}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-violet">Lv.{u.level}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {u.divisions.map((d: string) => (
                            <span key={d} className={`division-tag ${divTagClass[d]}`}>{d}</span>
                          ))}
                        </div>
                      </td>
                      <td><span className={styles.xpValue}>{u.xp.toLocaleString()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div> {/* close contentRef */}
      </div>
    </section>
  );
}
