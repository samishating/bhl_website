'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

const DIVISIONS = [
  { id: 'gaming', label: 'Gaming', icon: '🎮', image: '/brand/gaming.png', color: '#FFFDBA' },
  { id: 'music',  label: 'Music',  icon: '🎵', image: '/brand/music.png',  color: '#A855F7' },
  { id: 'sport',  label: 'Sport',  icon: '💪', image: '/brand/sport.png',  color: '#06B6D4' },
  { id: 'content',label: 'Content',icon: '🎬', image: '/brand/logo.png',   color: '#EF4444' },
];

export default function JoinPage() {
  const { showToast } = useToast();
  const [selectedDivision, setSelectedDivision] = useState('');
  const [form, setForm] = useState({ name: '', email: '', discord: '', motivation: '', links: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDivision) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, division: selectedDivision, type: 'creator' }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        showToast('Failed to submit application. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const divisionLabel = DIVISIONS.find(d => d.id === selectedDivision)?.label;
    const finalLabel = `${divisionLabel} Creator`;
    
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <img src="/ICONS/trophy_1.svg" alt="Success" style={{ width: '80px', height: '80px' }} />
          </div>
          <h2>Application Received!</h2>
          <p>
            Welcome, <strong>{form.name}</strong>. Your application as a{' '}
            <strong>{finalLabel}</strong> has been submitted.
            The Brotherhood will review your application and reach out via Discord.
          </p>
          <p className={styles.successSub}>May your legacy begin here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerGlow} />
        <div className="container">
          <div className="section-tag">Creators Program</div>
          <h1>Join the <span className="gradient-text">Brotherhood</span> as a Creator</h1>
          <p className={styles.headerSub}>
            Apply to become an official Content Creator, Gaming Creator, Music Artist, or Sports Personality within our ecosystem.
          </p>
        </div>
      </header>

      <div className="container">
        <div className={styles.formGrid}>
          {/* Specialty Select */}
          <div className={styles.divisionSelect}>
            <h3 className={styles.stepTitle}><span className={styles.stepNum}>01</span> Choose Your Specialty</h3>
            <div className={styles.divisionCards}>
              {DIVISIONS.map(d => (
                <motion.button
                  key={d.id}
                  type="button"
                  className={`${styles.divCard} ${selectedDivision === d.id ? styles.divCardSelected : ''}`}
                  style={{ '--div-color': d.color } as React.CSSProperties}
                  onClick={() => setSelectedDivision(d.id)}
                  id={`join-division-${d.id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {d.image ? (
                    <img src={d.image} alt={d.label} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                  ) : (
                    <span className={styles.divIcon}>{d.icon}</span>
                  )}
                  <span className={styles.divLabel}>
                    {d.label} Creator
                  </span>
                  {selectedDivision === d.id && <span className={styles.checkMark}>✓</span>}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className={styles.appForm}>
            <h3 className={styles.stepTitle}><span className={styles.stepNum}>02</span> Your Application</h3>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input required className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" id="join-name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input required type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" id="join-email" />
            </div>
            <div className="form-group">
              <label className="form-label">Discord Username</label>
              <input className="form-input" value={form.discord} onChange={e => setForm(p => ({ ...p, discord: e.target.value }))} placeholder="username#0000" id="join-discord" />
            </div>
            <div className="form-group">
              <label className="form-label">Why do you want to join? *</label>
              <textarea required className="form-input" rows={4} value={form.motivation} onChange={e => setForm(p => ({ ...p, motivation: e.target.value }))} placeholder="Tell us what you bring to the Brotherhood…" id="join-motivation" style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Portfolio / Social Links</label>
              <input className="form-input" value={form.links} onChange={e => setForm(p => ({ ...p, links: e.target.value }))} placeholder="Twitch, SoundCloud, Instagram…" id="join-links" />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedDivision || loading}
              id="join-submit-btn"
              style={{ width: '100%', minHeight: '50px' }}
            >
              {loading ? <><span className="spinner" /> Submitting…</> : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Submit Application <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} />
                </span>
              )}
            </button>
            {!selectedDivision && <p className={styles.hint}>Please select a division above</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
