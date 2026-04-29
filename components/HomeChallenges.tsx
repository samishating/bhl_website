'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './HomeChallenges.module.css';

const divTagClass: Record<string, string> = {
  gaming: 'tag-gaming', music: 'tag-music', sport: 'tag-sport', content: 'tag-content', global: 'tag-global',
};
const DIVS = ['global', 'gaming', 'music', 'sport', 'content'];

export default function HomeChallenges({ initialChallenges }: { initialChallenges?: any[] }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState<any[]>(initialChallenges || []);
  const [loading, setLoading] = useState(initialChallenges ? false : true);
  const [filter, setFilter] = useState('global');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, string>>({});
  const [confirmJoin, setConfirmJoin] = useState<any | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const headerRef = useScrollReveal<HTMLDivElement>();

  const contentRef = useScrollReveal<HTMLDivElement>(true);

  const loadChallenges = () => {
    setLoading(true);
    fetch(`/api/challenges?division=${filter}`)
      .then(r => r.json())
      .then(d => { setChallenges(d.challenges || []); setLoading(false); });
  };

  useEffect(() => {
    setHasMounted(true);
    // Only skip initial load if we have non-empty ISR data for the global filter
    if (filter === 'global' && initialChallenges && initialChallenges.length > 0) {
      // Keep ISR data
    } else {
      loadChallenges();
    }
  }, [filter, initialChallenges]);

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
    const handleRefresh = () => {
      loadChallenges();
    };
    window.addEventListener('stats-refresh', handleRefresh);
    
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
    
    return () => window.removeEventListener('stats-refresh', handleRefresh);
  }, [user]);

  const handleSubmit = async (challengeId: string) => {
    if (!user) return showToast('Please login to submit a challenge', 'error');
    
    const challenge = challenges.find(c => c._id === challengeId);
    if (!challenge) return;

    // Check division membership
    if (challenge.division !== 'global' && !user.divisions.includes(challenge.division)) {
      setConfirmJoin(challenge);
      return;
    }

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
      showToast(`Submitted! Pending approval.`, 'success');
    } else {
      showToast(`Submission failed`, 'error');
    }
  };

  const handleJoinAndSubmit = async () => {
    if (!confirmJoin || !user) return;
    const challenge = confirmJoin;
    const challengeId = challenge._id;
    const divId = challenge.division;
    
    setConfirmJoin(null);
    setSubmitting(challengeId);

    try {
      // Correct API endpoint as used in HomeDivisions.tsx
      const newDivisions = [...(user.divisions || []), divId];
      const joinRes = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ divisions: newDivisions }),
      });

      if (joinRes.ok) {
        // Trigger global refresh (AuthContext now listens to this)
        window.dispatchEvent(new Event('stats-refresh'));
        
        // Wait a tiny bit for the context to update or just proceed
        // Since the server now knows we are in the division, the submission will succeed.
        
        // Now proceed with submission
        const proof = proofUrls[challengeId]?.trim();
        if (!proof) {
          showToast(`Joined ${divId}! Enter proof and submit again.`, 'success');
          setSubmitting(null);
          return;
        }

        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId, proofUrl: proof }),
        });

        if (res.ok) {
          setSubmissionStatus(prev => ({ ...prev, [challengeId]: 'pending' }));
          showToast(`Joined & Submitted successfully!`, 'success');
        } else {
          showToast(`Joined ${divId}, but submission failed`, 'error');
        }
      } else {
        showToast('Failed to join division', 'error');
      }
    } catch (e) {
      showToast('Error processing request', 'error');
    } finally {
      setSubmitting(null);
    }

  };


  return (
    <section id="challenges" className="content-band" style={{ borderTop: 'none' }}>
      <div className="content-inner">
        <div ref={headerRef}>
          <div data-reveal="header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-tag">Earn XP</div>
            <h2>Active <span className="gradient-text">Challenges</span></h2>
            <p style={{ color: 'var(--text-secondary)' }}>Complete tasks, submit proof, and level up your legacy.</p>
          </div>
        </div>

        <div ref={contentRef}>

        <div className={styles.tabs} ref={tabsRef}>
          {hasMounted && (
            <div 
              className={styles.indicator} 
              style={{ 
                left: `${indicatorStyle.left}px`, 
                width: `${indicatorStyle.width}px` 
              }} 
            />
          )}
          {DIVS.map(d => (
            <button key={d} className={`${styles.tab} ${filter === d ? styles.tabActive : ''}`}
              onClick={() => setFilter(d)}>
              {d === 'global' ? 'Global' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className="skeleton" style={{ width: '80px', height: '1.5rem', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ width: '60px', height: '1.5rem', borderRadius: '4px' }} />
                </div>
                <div className="skeleton" style={{ width: '80%', height: '1.5rem', marginBottom: '1rem' }} />
                <div className="skeleton" style={{ width: '100%', height: '1rem', marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ width: '90%', height: '1rem', marginBottom: '1.5rem' }} />
                <div className="skeleton" style={{ width: '100%', height: '46px', borderRadius: 'var(--radius-sm)' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {challenges.map(c => {
              const status = submissionStatus[c._id];
              return (
                <div key={c._id} className={`${styles.card} ${status === 'approved' ? styles.cardDone : ''}`}>
                  <div className={styles.cardTop}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`division-tag ${divTagClass[c.division] || 'tag-global'}`}>{c.division}</span>
                      {c.allowRepeats && <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>Repeatable</span>}
                    </div>
                    <span className={styles.xpBadge}>+{c.xpReward} XP</span>
                  </div>
                  <h3 className={styles.cardTitle}>{c.title}</h3>
                  <p className={styles.cardDesc}>{c.description}</p>
                  
                  {status && !c.allowRepeats ? (
                    <div className={styles.doneState}>
                      {status === 'approved' ? '✅ Completed' : status === 'rejected' ? '❌ Rejected' : '⏳ Pending Approval'}
                    </div>
                  ) : (
                    <div className={styles.submitForm}>
                      {status && c.allowRepeats && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          Last status: <span style={{ color: status === 'approved' ? '#22c55e' : 'var(--brand-red)' }}>{status.toUpperCase()}</span>
                        </div>
                      )}
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
                        disabled={hasMounted ? submitting === c._id : undefined}
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
        </div> {/* close contentRef */}
      </div>

      {/* Custom Join Modal */}
      {confirmJoin && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>🛡️</div>
            <h3 className={styles.modalTitle}>Join Required</h3>
            <p className={styles.modalText}>
              This challenge requires the <strong style={{ color: 'var(--neon-blue)' }}>{confirmJoin.division.toUpperCase()}</strong> division. 
              Join now to complete this challenge?
            </p>
            <div className={styles.modalButtons}>
              <button className="btn btn-ghost" onClick={() => setConfirmJoin(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleJoinAndSubmit}>Join & Submit</button>
            </div>
          </div>
        </div>
      )}
    </section>

  );
}
