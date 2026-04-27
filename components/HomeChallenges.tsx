'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import styles from '@/app/(main)/challenges/page.module.css';

const divTagClass: Record<string, string> = {
  gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content', global: 'tag-global',
};
const DIVS = ['global', 'gaming', 'music', 'sport', 'content'];

export default function HomeChallenges() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('global');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
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

  const handleSubmit = async (challengeId: string) => {
    if (!user) return showToast('Please login to submit a challenge', 'error');
    const proof = proofUrls[challengeId]?.trim();
    if (!proof) return showToast('Please enter a proof URL', 'error');

    setSubmitting(challengeId);
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, proofUrl: proof }),
    });
    setSubmitting(null);

    if (res.ok) {
      setSubmissionStatus(prev => ({ ...prev, [challengeId]: 'pending' }));
      showToast(`✅ Submitted! Pending approval.`);
    } else {
      showToast(`❌ Submission failed`, 'error');
    }
  };

  return (
    <section id="challenges" className="content-band" style={{ borderTop: 'none' }}>
      <div className="content-inner">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="section-tag">Earn XP</div>
          <h2>Active <span className="gradient-text">Challenges</span></h2>
          <p style={{ color: 'var(--text-secondary)' }}>Complete tasks, submit proof, and level up your legacy.</p>
        </div>

        <div className={styles.tabs} style={{ justifyContent: 'center', marginBottom: '4rem' }}>
          {DIVS.map(d => (
            <button key={d} className={`${styles.tab} ${filter === d ? styles.tabActive : ''}`}
              onClick={() => setFilter(d)}>
              {d === 'global' ? '🌐 Global' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
        ) : (
          <div className={styles.grid}>
            {challenges.map(c => {
              const status = submissionStatus[c._id];
              return (
                <div key={c._id} className={`${styles.card} ${status === 'approved' ? styles.cardDone : ''}`}>
                  <div className={styles.cardTop}>
                    <span className={`division-tag ${divTagClass[c.division] || 'tag-global'}`}>{c.division}</span>
                    <span className={styles.xpBadge}>+{c.xpReward} XP</span>
                  </div>
                  <h3 className={styles.cardTitle}>{c.title}</h3>
                  <p className={styles.cardDesc}>{c.description}</p>
                  
                  {status ? (
                    <div className={styles.doneState}>
                      {status === 'approved' ? '✅ Completed' : status === 'rejected' ? '❌ Rejected' : '⏳ Pending Approval'}
                    </div>
                  ) : (
                    <div className={styles.submitForm}>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="Paste proof URL…"
                        value={proofUrls[c._id] || ''}
                        onChange={e => setProofUrls(prev => ({ ...prev, [c._id]: e.target.value }))}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSubmit(c._id)}
                        disabled={submitting === c._id}
                      >
                        {submitting === c._id ? <span className="spinner" /> : 'Submit'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
