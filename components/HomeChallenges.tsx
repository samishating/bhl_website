'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer, dropdownAnimation } from '@/lib/animations';
import Modal from '@/components/Modal';
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
  const tabsRef = useRef<HTMLDivElement>(null);

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
    setHasMounted(true);
  }, []);

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
      <div className="section-divider" />
      <div className="content-inner" style={{ paddingTop: '4rem' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
        >
          <div className="section-header">
            <span className="section-tag">Earn XP</span>
            <h2>Active <span className="gradient-text">Challenges</span></h2>
            <p className="section-desc">Complete tasks, submit proof, and level up your legacy.</p>
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
            {DIVS.map(d => (
              <button 
                key={d} 
                className={`${styles.tab} ${filter === d ? styles.tabActive : ''}`}
                onClick={() => setFilter(d)}
              >
                {d === 'global' ? 'Global' : d.charAt(0).toUpperCase() + d.slice(1)}
                {filter === d && (
                  <motion.div 
                    layoutId="challengeTab"
                    className={styles.indicator}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
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
          ) : (
            <motion.div 
              key={`grid-${filter}`}
              className={styles.grid}
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {challenges.map(c => {
                const status = submissionStatus[c._id];
                return (
                  <motion.div 
                    key={c._id} 
                    variants={fadeUp}
                    className={`${styles.card} premium-panel ${status === 'approved' ? styles.cardDone : ''}`}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
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
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Animated Modal via centralized component */}
      <Modal 
        isOpen={!!confirmJoin} 
        onClose={() => setConfirmJoin(null)}
        title="Join Required"
        maxWidth="480px"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmJoin(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleJoinAndSubmit}>Join & Submit</button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🛡️</div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This challenge requires the <strong style={{ color: 'var(--brand-red)' }}>{confirmJoin?.division.toUpperCase()}</strong> division. 
            Join now to complete this challenge?
          </p>
        </div>
      </Modal>
    </section>

  );
}
