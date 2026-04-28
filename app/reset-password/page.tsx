'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import styles from '../auth.module.css';


function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!token) {
      showToast('❌ Invalid reset link', 'error');
      router.push('/login');
    }
  }, [token, router, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('❌ Passwords do not match', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('❌ Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        showToast('✅ Password reset successful! Please login.', 'success');
        router.push('/login');
      } else {
        const data = await res.json();
        showToast(`❌ ${data.error || 'Reset failed'}`, 'error');
      }
    } catch (err) {
      showToast('❌ Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.card} style={{ maxWidth: '440px' }}>

        <h2 style={{ fontFamily: 'Rajdhani', fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Set New <span className="gradient-text">Password</span></h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Choose a secure password for your account.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="reset-password-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              id="reset-password-confirm"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !token} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link href="/login" className="hover-link" style={{ color: 'var(--text-secondary)' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
