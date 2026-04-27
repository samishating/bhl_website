'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Application {
  _id: string;
  userId?: { _id: string; username: string; avatar: string; xp: number; level: number; };
  division: string;
  name: string;
  email: string;
  discord: string;
  motivation: string;
  links: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function ApplicationsInbox() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    fetch('/api/applications')
      .then(r => r.json())
      .then(d => { setApps(d.applications || []); setLoading(false); });
  };

  useEffect(load, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActioning(id);
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setActioning(null);

    if (res.ok) {
      load();
      showToast(`✅ Application ${status}!`);
    } else {
      showToast('❌ Action failed');
    }
  };

  return (
    <div className={styles.page}>
      {toast && <div className="toast">{toast}</div>}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Applications Inbox</h1>
          <p className={styles.sub}>{apps.filter(a => a.status === 'pending').length} pending applications</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : apps.length === 0 ? (
        <div className={styles.empty}>No applications received yet.</div>
      ) : (
        <div className={styles.appList}>
          {apps.map(app => (
            <div key={app._id} className={`${styles.appCard} ${styles[app.status]}`}>
              <div className={styles.appHeader}>
                <div className={styles.userInfo}>
                  <div className={`avatar ${styles.appAvatar}`}>
                    {app.userId?.avatar ? <img src={app.userId.avatar} alt="" /> : app.userId?.username?.[0].toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.username}>{app.userId?.username}</div>
                    <div className={styles.userMeta}>Lv.{app.userId?.level} • {app.userId?.xp} XP</div>
                  </div>
                </div>
                <div className={`badge ${app.status === 'pending' ? 'badge-blue' : app.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                  {app.status.toUpperCase()}
                </div>
              </div>

              <div className={styles.appBody}>
                <div className={styles.appField}>
                  <label>Full Name</label>
                  <div>{app.name}</div>
                </div>
                <div className={styles.appField}>
                  <label>Email</label>
                  <div>{app.email}</div>
                </div>
                <div className={styles.appField}>
                  <label>Discord</label>
                  <div>{app.discord || 'N/A'}</div>
                </div>
                <div className={styles.appField}>
                  <label>Division</label>
                  <div><span className={`division-tag tag-${app.division}`}>{app.division}</span></div>
                </div>
                <div className={styles.appField}>
                  <label>Social / Portfolio</label>
                  {app.links ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {app.links.split(',').map(link => link.trim()).filter(Boolean).map((link, idx) => (
                        <a key={idx} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className={styles.link}>
                          {link} ↗
                        </a>
                      ))}
                    </div>
                  ) : <div>N/A</div>}
                </div>
                <div className={styles.appField} style={{ gridColumn: '1 / -1' }}>
                  <label>Why do you want to join?</label>
                  <div className={styles.reasonText}>{app.motivation}</div>
                </div>
              </div>

              {app.status === 'pending' && (
                <div className={styles.appActions}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleAction(app._id, 'approved')} disabled={actioning === app._id}>
                    Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleAction(app._id, 'rejected')} disabled={actioning === app._id}>
                    Reject
                  </button>
                </div>
              )}
              
              <div className={styles.appDate}>
                Submitted {new Date(app.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
