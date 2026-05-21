'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import styles from '../auth.module.css';

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
        showToast('If an account exists, a link has been sent.', 'success');
      } else {
        const data = await res.json();
        showToast(`${data.error || 'Something went wrong'}`, 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.card} style={{ maxWidth: '440px' }}>

        <h2 style={{ fontFamily: 'Rajdhani', fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Forgot <span className="gradient-text">Password</span></h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="forgot-password-email"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>Check your inbox. We&apos;ve sent a password reset link to <strong>{email}</strong>.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => setSubmitted(false)}>Try another email</button>
          </div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link href="/login" className="hover-link" style={{ color: 'var(--text-secondary)' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
