'use client';
import { useState, useEffect } from 'react';
import { calculateLevel, getLevelTitle, BADGES } from '@/lib/xp';
import styles from './page.module.css';

const DIVISIONS = ['all', 'gaming', 'music', 'sport', 'content'];

interface LeaderboardUser {
  _id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  divisions: string[];
  badges: string[];
}

const divTagClass: Record<string, string> = {
  gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content',
};

const rankIcons = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?division=${filter}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); });
  }, [filter]);

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerGlow} />
        <div className="container">
          <div className="section-tag">Rankings</div>
          <h1>Global <span className="gradient-text">Leaderboard</span></h1>
          <p className={styles.headerSub}>Top members ranked by XP across all divisions</p>
        </div>
      </section>

      <div className="container">
        {/* Tabs */}
        <div className={styles.tabs}>
          {DIVISIONS.map(d => (
            <button
              key={d}
              className={`${styles.tab} ${filter === d ? styles.tabActive : ''}`}
              onClick={() => setFilter(d)}
              id={`leaderboard-tab-${d}`}
            >
              {d === 'all' ? '🌐 Global' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
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
                  <a href={`/users/${u._id}`} className={styles.podiumName}>{u.username}</a>
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
            <div className={styles.loadingState}>
              <div className="spinner" />
              <p>Loading rankings…</p>
            </div>
          ) : users.length === 0 ? (
            <div className={styles.emptyState}>No members yet in this division.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Member</th>
                    <th>Level</th>
                    <th>Division</th>
                    <th>Badges</th>
                    <th>XP</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} className={i < 3 ? styles.topRow : ''}>
                      <td>
                        <span className={styles.rank}>
                          {i < 3 ? rankIcons[i] : <span className={styles.rankNum}>{i + 1}</span>}
                        </span>
                      </td>
                      <td>
                        <div className={styles.memberCell}>
                          <div className="avatar">
                            {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0].toUpperCase()}
                          </div>
                          <div>
                            <a href={`/users/${u._id}`} className={styles.memberName}>{u.username}</a>
                            <div className={styles.memberTitle}>{getLevelTitle(u.level)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-violet">Lv.{u.level}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {u.divisions.map(d => (
                            <span key={d} className={`division-tag ${divTagClass[d] || ''}`}>{d}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {u.badges.slice(0, 3).map(b => (
                            <span key={b} className={styles.badgePill}
                              style={{ color: BADGES[b as keyof typeof BADGES]?.color || '#a0a0b8' }}>
                              {BADGES[b as keyof typeof BADGES]?.label || b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={styles.xpValue}>{u.xp.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
