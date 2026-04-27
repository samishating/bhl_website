'use client';
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface PopulatedSubmission {
  _id: string;
  userId: { _id: string; username: string; avatar: string; divisions: string[] };
  challengeId: { _id: string; title: string; xpReward: number; division: string };
  proofUrl: string;
  createdAt: string;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<PopulatedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

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
    // Removing confirmation alert per user request, using toast for feedback
    setProcessingId(id);
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      setSubmissions(prev => prev.filter(s => s._id !== id));
    } else {
      const data = await res.json();
      showToast(`❌ Error: ${data.error}`);
    }
    setProcessingId(null);
  };

  return (
    <div>
      {toast && <div className="toast">{toast}</div>}
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
                <th>XP Reward</th>
                <th>Proof</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar avatar-sm">
                        {sub.userId?.avatar ? <img src={sub.userId.avatar} alt="avatar" /> : sub.userId?.username?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{sub.userId?.username}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{sub.challengeId?.title}</td>
                  <td><span className="badge badge-red">+{sub.challengeId?.xpReward} XP</span></td>
                  <td>
                    <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-blue)', textDecoration: 'underline' }}>
                      View Proof ↗
                    </a>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td>
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
