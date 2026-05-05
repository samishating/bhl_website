'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdmin } from '../layout';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import styles from './page.module.css';

import ConfirmationModal from '@/components/ConfirmationModal';

interface PopulatedSubmission {
  _id: string;
  userId: { _id: string; username: string; avatar: string; divisions: string[] };
  challengeId: { _id: string; title: string; xpReward: number; division: string };
  proofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  processedBy?: { username: string };
  createdAt: string;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<PopulatedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<{ id: string; action: 'revoke' } | null>(null);
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { refreshCounts, setGlobalLoading } = useAdmin();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const res = await fetch('/api/admin/submissions');
    const data = await res.json();
    if (data.submissions) setSubmissions(data.submissions);
    setLoading(false);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'revoke') => {
    if (action === 'revoke') {
      setConfirmData({ id, action });
      return;
    }
    executeAction(id, action);
  };

  const executeAction = async (id: string, action: 'approve' | 'reject' | 'revoke') => {
    setGlobalLoading(true);
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Request failed');
      }
      
      refreshCounts();
      fetchSubmissions();
      showToast(`Submission ${action === 'revoke' ? 'Revoked' : action.toUpperCase() + 'ED'}`, 'success');
      window.dispatchEvent(new Event('stats-refresh'));
    } catch (err: any) {
      showToast(`${err.message}`, 'error');
    } finally {
      setProcessingId(null);
      setGlobalLoading(false);
      setConfirmData(null);
    }
  };

  const isSuper = currentUser?.role === 'superadmin';

  return (
    <>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Challenge Submissions</h1>
            <p className={styles.sub}>Review submissions and award XP</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '10rem' }}>
            <div className="loader-visual" style={{ margin: '0 auto' }}>
              <div className="loader-arc" />
              <img src="/brand/logo.webp" alt="" className="loader-logo" />
            </div>
            <p className="loader-text" style={{ marginTop: '2rem' }}>Loading Submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🛡️</span>
            <h3 className={styles.title} style={{ fontSize: '1.2rem' }}>All Caught Up</h3>
            <p style={{ color: 'var(--text-muted)' }}>No pending submissions to review.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Challenge Details</th>
                  <th>Status</th>
                  <th>Proof</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub._id}>
                    <td>
                      <a href={`/users/${sub.userId?._id}`} className={styles.userCell}>
                        <div className={styles.avatar}>
                          {sub.userId?.avatar ? <img src={sub.userId.avatar} alt="" /> : sub.userId?.username?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'white' }}>{sub.userId?.username}</span>
                      </a>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{sub.challengeId?.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--brand-red)', fontWeight: 800 }}>+{sub.challengeId?.xpReward} XP</div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[sub.status]}`}>
                        {sub.status}
                      </span>
                      {sub.processedBy && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                          Reviewed by: {sub.processedBy.username}
                        </div>
                      )}
                    </td>
                    <td>
                      <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
                        VIEW PROOF ↗
                      </a>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {sub.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAction(sub._id, 'approve')}
                            disabled={processingId === sub._id}
                          >
                            {processingId === sub._id ? '…' : 'APPROVE'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleAction(sub._id, 'reject')}
                            disabled={processingId === sub._id}
                          >
                            REJECT
                          </button>
                        </div>
                      ) : sub.status === 'approved' && isSuper ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleAction(sub._id, 'revoke')}
                          disabled={processingId === sub._id}
                          style={{ color: 'var(--brand-red)', borderColor: 'rgba(255,0,0,0.2)' }}
                        >
                          {processingId === sub._id ? '…' : '⚠️ REVOKE'}
                        </button>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Reviewed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>


      <ConfirmationModal
        isOpen={!!confirmData}
        title="Revoke Submission?"
        message="Are you sure you want to revoke this submission? XP will be deducted from the user."
        confirmLabel="Revoke"
        variant="danger"
        onConfirm={() => confirmData && executeAction(confirmData.id, confirmData.action)}
        onCancel={() => setConfirmData(null)}
      />
    </>
  );
}
