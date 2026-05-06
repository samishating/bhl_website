'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAdmin } from '../layout';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
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
  type: 'member' | 'creator';
  processedBy?: { username: string };
  createdAt: string;
}

export default function ApplicationsInbox() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const { showToast } = useToast();
  const { refreshCounts, setGlobalLoading } = useAdmin();

  const load = () => {
    setLoading(true);
    fetch('/api/applications')
      .then(r => r.json())
      .then(d => { setApps(d.applications || []); setLoading(false); });
  };

  useEffect(load, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected', makePublic: boolean = false) => {
    setGlobalLoading(true);
    const prevApps = [...apps];
    setApps(current => current.map(a => a._id === id ? { ...a, status } : a));
    
    setActioning(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, makePublic }),
      });
      
      if (!res.ok) throw new Error('Request failed');
      
      refreshCounts();
      load();
      showToast(`Application ${status === 'approved' ? 'APPROVED' : 'REJECTED'}`, 'success');
    } catch (err) {
      setApps(prevApps);
      showToast('Action failed', 'error');
    } finally {
      setActioning(null);
      setGlobalLoading(false);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Applications</h1>
          <p className={styles.sub}>Review applications for platform membership</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '10rem' }}>
          <div className="loader-visual" style={{ margin: '0 auto' }}>
            <div className="loader-arc" />
            <img src="/brand/logo.png" alt="" className="loader-logo" />
          </div>
          <p className="loader-text" style={{ marginTop: '2rem' }}>Loading Applications...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className={styles.empty}>
          <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No pending applications</p>
        </div>
      ) : (
        <motion.div 
          className={styles.appList}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {apps.map(app => (
            <motion.div key={app._id} className={styles.appCard} variants={fadeUp}>
              <div className={styles.appDate}>
                RECEIVED: {new Date(app.createdAt).toLocaleString()}
              </div>

              <div className={styles.appHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.appAvatar}>
                    {app.userId?.avatar ? <img src={app.userId.avatar} alt="" /> : app.userId?.username?.[0].toUpperCase() || 'G'}
                  </div>
                  <div>
                    <div className={styles.username}>{app.userId?.username || 'Guest Applicant'}</div>
                    <div className={styles.userMeta}>
                      {app.userId ? `User Level ${app.userId.level} • ${app.userId.xp} XP` : 'External Application'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <span className={`${styles.statusBadge} ${app.type === 'creator' ? styles.creatorBadge : styles.memberBadge}`}>
                      {app.type || 'MEMBER'}
                    </span>
                    <span className={`${styles.statusBadge} ${styles[app.status + 'Badge']}`}>
                      {app.status}
                    </span>
                  </div>
                  {app.processedBy && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 700 }}>
                      REVIEWED BY: {app.processedBy.username.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.appBody}>
                <div className={styles.appField}>
                  <label>Full Name</label>
                  <div>{app.name}</div>
                </div>
                <div className={styles.appField}>
                  <label>Contact Email</label>
                  <div style={{ fontSize: '0.85rem' }}>
                    {app.email}<br/>
                    {app.discord && <span style={{ color: 'var(--brand-red)' }}>DISCORD: {app.discord}</span>}
                  </div>
                </div>
                <div className={styles.appField}>
                  <label>Target Division</label>
                  <div><span className={`division-tag tag-${app.division}`}>{app.division}</span></div>
                </div>
                <div className={styles.appField}>
                  <label>Links</label>
                  {app.links ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {app.links.split(',').map(link => link.trim()).filter(Boolean).map((link, idx) => (
                        <a key={idx} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className={styles.link}>
                          {link.length > 30 ? link.slice(0, 30) + '...' : link} ↗
                        </a>
                      ))}
                    </div>
                  ) : <div>N/A</div>}
                </div>
                <div className={styles.appField} style={{ gridColumn: '1 / -1' }}>
                  <label>Motivation</label>
                  <div className={styles.reasonText}>{app.motivation}</div>
                </div>
              </div>

              {app.status === 'pending' && (
                <div className={styles.appActions} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => handleAction(app._id, 'approved', false)} disabled={actioning === app._id} style={{ flex: 1 }}>
                      APPROVE
                    </button>
                    <button className="btn btn-ghost" onClick={() => handleAction(app._id, 'rejected')} disabled={actioning === app._id} style={{ flex: 1, color: 'var(--brand-red)' }}>
                      REJECT
                    </button>
                  </div>
                  {app.userId && (
                    <button className="btn btn-primary" onClick={() => handleAction(app._id, 'approved', true)} disabled={actioning === app._id} style={{ width: '100%', background: 'linear-gradient(90deg, #ff0055, #cc0000)', border: 'none', color: '#fff' }}>
                      APPROVE & SHOW ON COMMUNITY PAGE
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
