'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { xpForNextLevel, getLevelTitle, BADGES, calculateLevel } from '@/lib/xp';
import styles from './page.module.css';

interface Challenge {
  _id: string;
  title: string;
  description: string;
  xpReward: number;
  division: string;
}

const divTagClass: Record<string, string> = {
  gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content', global: 'tag-global',
};

export default function ChallengesPage() {
  const { user, updateUser } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('global');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/challenges?division=${filter}`)
      .then(r => r.json())
      .then(d => { setChallenges(d.challenges || []); setLoading(false); });
  }, [filter]);

  useEffect(() => {
    if (user) {
      fetch(`/api/submissions?userId=${user.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.submissions) {
            const statusMap: Record<string, string> = {};
            d.submissions.forEach((s: any) => {
              const cid = s.challengeId && typeof s.challengeId === 'object' ? s.challengeId._id : s.challengeId;
              if (cid) statusMap[cid] = s.status;
            });
            setSubmissionStatus(statusMap);
          }
        });
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (challengeId: string) => {
    if (!user) return showToast('Please login to submit a challenge');
    const proof = proofUrls[challengeId]?.trim();
    if (!proof) return showToast('Please enter a proof URL');

    setSubmitting(challengeId);
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, proofUrl: proof }),
    });
    const data = await res.json();
    setSubmitting(null);

    if (res.ok) {
      setSubmissionStatus(prev => ({ ...prev, [challengeId]: 'pending' }));
      showToast(`✅ Submitted! Pending admin approval.`);
    } else {
      showToast(`❌ ${data.error}`);
    }
  };

  const DIVS = ['global', 'gaming', 'music', 'sport', 'content'];

  return (
    <div className={styles.page}>
      {toast && <div className="toast">{toast}</div>}

      <section className={styles.header}>
        <div className={styles.headerGlow} />
        <div className="container">
          <div className="section-tag">Earn XP</div>
          <h1><span className="gradient-text">Challenges</span></h1>
          <p className={styles.headerSub}>Complete challenges, submit your proof, and earn XP to climb the leaderboard.</p>
        </div>
      </section>

      <div className="container">
        <div className={styles.tabs}>
          {DIVS.map(d => (
            <button key={d} className={`${styles.tab} ${filter === d ? styles.tabActive : ''}`}
              onClick={() => setFilter(d)} id={`challenges-tab-${d}`}>
              {d === 'global' ? '🌐 Global' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : challenges.length === 0 ? (
          <div className={styles.empty}>No challenges available right now. Check back soon!</div>
        ) : (
          <div className={styles.grid}>
            {challenges.map(c => {
              const status = submissionStatus[c._id];
              const done = !!status;
              return (
                <div key={c._id} className={`${styles.card} ${status === 'approved' ? styles.cardDone : ''}`} id={`challenge-${c._id}`}>
                  <div className={styles.cardTop}>
                    <span className={`division-tag ${divTagClass[c.division] || 'tag-global'}`}>{c.division}</span>
                    <span className={styles.xpBadge}>+{c.xpReward} XP</span>
                  </div>
                  <h3 className={styles.cardTitle}>{c.title}</h3>
                  <p className={styles.cardDesc}>{c.description}</p>
                  {done ? (
                    <div className={styles.doneState}>
                      {status === 'approved' ? '✅ Completed' : status === 'rejected' ? '❌ Rejected' : '⏳ Pending Approval'}
                    </div>
                  ) : (
                    <div className={styles.submitForm}>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="Paste proof URL (image/video link)…"
                        value={proofUrls[c._id] || ''}
                        onChange={e => setProofUrls(prev => ({ ...prev, [c._id]: e.target.value }))}
                        id={`proof-input-${c._id}`}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSubmit(c._id)}
                        disabled={submitting === c._id}
                        id={`submit-challenge-${c._id}`}
                      >
                        {submitting === c._id ? <span className="spinner" /> : 'Submit Proof'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
