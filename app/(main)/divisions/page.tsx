'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

const divisions = [
  {
    id: 'gaming', label: 'Gaming', icon: '🎮', image: '/brand/gaming.png', color: '#FF0000', tag: 'tag-gaming',
    desc: 'Our Gaming division is home to the most competitive gamers in the Brotherhood. We compete across titles like Valorant, League of Legends, FIFA, and more. If you have the skill and the drive to win, this is your home.',
    perks: ['Team scrimmages', 'Tournament entries', 'Coaching sessions', 'Exclusive gaming gear discounts'],
    members: 142,
  },
  {
    id: 'music', label: 'Music', icon: '🎵', image: '/brand/music.png', color: '#FFFDBA', tag: 'tag-music',
    desc: 'The Music division unites producers, artists, and audio engineers under one roof. From trap to electronic, from rap to lo-fi — we push the boundaries of sound and help each other grow as artists.',
    perks: ['Beat sharing sessions', 'Collab opportunities', 'Release promotion', 'Studio tips & resources'],
    members: 98,
  },
  {
    id: 'sport', label: 'Sport', icon: '💪', image: '/brand/sport.png', color: '#FF5050', tag: 'tag-sport',
    desc: 'The Sport division covers everything from intense physical discipline to global sports like Football, F1, and MMA. Stay active, discuss the latest matches, and crush your goals.',
    perks: ['Live match discussions', 'Fitness & nutrition tips', 'Fantasy leagues', 'Workout challenges'],
    members: 117,
  },
  {
    id: 'content', label: 'Content', icon: '🎬', image: '/brand/logo.png', color: '#CC0000', tag: 'tag-content',
    desc: 'The Content division is where memes, videos, and viral moments are born. We support streamers, editors, photographers, and memers who want to build their brand and dominate the digital world.',
    perks: ['Cross-promotion', 'Editing resources', 'Content calendars', 'Platform growth tips'],
    members: 143,
  },
];

export default function DivisionsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [divisionCounts, setDivisionCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.divisionCounts) {
          setDivisionCounts(data.divisionCounts);
        }
      })
      .catch(console.error);
  }, []);

  const handleToggleDivision = async (divId: string) => {
    if (!user) {
      router.push('/login?callbackUrl=/divisions');
      return;
    }

    setJoining(divId);
    
    const isMember = user.divisions?.includes(divId);
    const newDivisions = isMember 
      ? user.divisions.filter(d => d !== divId)
      : [...(user.divisions || []), divId];

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ divisions: newDivisions }),
      });

      if (res.ok) {
        await refreshUser();
        setToast(isMember ? '🚪 Left division' : '✅ Successfully joined division!');
      } else {
        setToast(isMember ? '❌ Failed to leave division' : '❌ Failed to join division');
      }
    } catch (e) {
      setToast('❌ Error updating division');
    }

    setJoining(null);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className={styles.page}>
      {toast && <div className="toast">{toast}</div>}
      {/* Header */}
      <section className={styles.header}>
        <div className={styles.headerGlow} />
        <div className="container">
          <div className="section-tag">Brotherhood Divisions</div>
          <h1>Choose Your <span className="gradient-text">Division</span></h1>
          <p className={styles.headerSub}>
            Four paths. One brotherhood. Each division has its own culture, challenges, and leaderboard.
            Find where you belong — or conquer them all.
          </p>
        </div>
      </section>

      {/* Divisions Grid */}
      <section className={styles.divisionsSection}>
        <div className="container">
          <div className={styles.divisionsGrid}>
            {divisions.map((div, i) => {
              const isMember = user?.divisions?.includes(div.id);
              return (
              <div
                key={div.id}
                className={styles.divCard}
                style={{ animationDelay: `${i * 0.12}s`, '--div-color': div.color } as React.CSSProperties}
                id={`division-card-${div.id}`}
              >
                <div className={styles.divCardGlow} style={{ background: div.color }} />
                <div className={styles.divCardTop}>
                  {div.image ? (
                    <img src={div.image} alt={div.label} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                  ) : (
                    <span className={styles.divIcon}>{div.icon}</span>
                  )}
                  <div>
                    <div className={`division-tag ${div.tag}`}>{div.label}</div>
                    <div className={styles.memberCount}>{divisionCounts[div.id] !== undefined ? divisionCounts[div.id] : div.members} members</div>
                  </div>
                </div>
                <p className={styles.divDesc}>{div.desc}</p>
                <div className={styles.divPerks}>
                  <div className={styles.perksTitle}>Division Perks</div>
                  {div.perks.map(p => (
                    <div key={p} className={styles.perk}>
                      <span style={{ color: div.color }}>✓</span> {p}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleToggleDivision(div.id)}
                  disabled={joining === div.id}
                  className={isMember ? "btn btn-secondary" : "btn btn-primary"}
                  style={isMember ? { borderColor: div.color } : { background: `linear-gradient(135deg, ${div.color}, #880000)` }}
                  id={`division-join-${div.id}`}
                >
                  {joining === div.id ? <span className="spinner" /> : isMember ? `Leave ${div.label}` : `Join ${div.label}`}
                </button>
              </div>
            )})}
          </div>
        </div>
      </section>
    </div>
  );
}
