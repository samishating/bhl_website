'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAdmin } from '../layout';
import styles from '../admin.module.css';

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

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setGlobalLoading(true);
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (!res.ok) throw new Error('Failed');
      
      refreshCounts();
      fetchSubmissions();
      showToast(`✅ Submission ${action}ed!`, 'success');
    } catch (err) {
      showToast('❌ Failed to process submission', 'error');
    } finally {
      setProcessingId(null);
      setGlobalLoading(false);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Challenge Inbox</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Review pending challenge submissions and award XP manually.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>
      ) : submissions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
          <h3>Inbox Zero</h3>
          <p style={{ color: 'var(--text-muted)' }}>No pending submissions right now.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Challenge</th>
                <th>Status</th>
                <th>Proof</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub._id}>
                  <td>
                      <a href={`/users/${sub.userId?._id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'inherit', textDecoration: 'none' }}>
                        <div className="avatar avatar-sm">
                          {sub.userId?.avatar ? <img src={sub.userId.avatar} alt="avatar" /> : sub.userId?.username?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{sub.userId?.username}</span>
                      </a>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.challengeId?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--brand-red)' }}>+{sub.challengeId?.xpReward} XP</div>
                  </td>
                  <td>
                    <div style={{ 
                      color: sub.status === 'approved' ? 'var(--neon-green)' : sub.status === 'rejected' ? 'var(--brand-red)' : 'var(--neon-blue)',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '1px'
                    }}>
                      {sub.status}
                    </div>
                    {sub.processedBy && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        by {sub.processedBy.username}
                      </div>
                    )}
                  </td>
                  <td>
                    <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-blue)', textDecoration: 'underline' }}>
                      View Proof ↗
                    </a>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {sub.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAction(sub._id, 'approve')}
                          disabled={processingId === sub._id}
                          id={`approve-btn-${sub._id}`}
                        >
                          {processingId === sub._id ? '…' : 'Approve'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleAction(sub._id, 'reject')}
                          disabled={processingId === sub._id}
                          id={`reject-btn-${sub._id}`}
                          style={{ border: '1px solid var(--text-muted)' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
