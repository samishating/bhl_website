'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function ApplyPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', socialLink: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { showToast('❌ You must be logged in to apply'); return; }
    
    setLoading(true);
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);

    if (res.ok) {
      setSubmitted(true);
      showToast('✅ Application submitted!');
    } else {
      const d = await res.json();
      showToast(`❌ ${d.error || 'Failed'}`);
    }
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
          <h1 className="gradient-text">Application Sent!</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '1rem auto' }}>
            We've received your application. Our staff will review it and get back to you soon.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/'}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {toast && <div className="toast">{toast}</div>}
      <div className="container" style={{ maxWidth: '600px', padding: '4rem 1rem' }}>
        <div className="section-tag">Recruitment</div>
        <h1 className="gradient-text">Apply for <span style={{ color: '#fff' }}>BHL</span></h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          Want to join the inner circle? Tell us about yourself and why you want to be part of the Legacy.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input required className="form-input" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input required type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Social Media / Portfolio Link</label>
            <input required className="form-input" value={form.socialLink} onChange={e => setForm(p => ({ ...p, socialLink: e.target.value }))} placeholder="Instagram, Twitter, or Website" />
          </div>
          <div className="form-group">
            <label className="form-label">Why do you want to join?</label>
            <textarea required className="form-input" rows={5} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Tell us your story..." />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Submit Application ⚔️'}
          </button>
        </form>
      </div>
    </div>
  );
}
