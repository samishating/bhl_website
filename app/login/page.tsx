'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import styles from '../auth.module.css';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);
    if (result.success) {
      const callbackUrl = searchParams.get('callbackUrl') || '/profile';
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <Link href="/" className={styles.logo}>
          <img src="/brand/logo.png" alt="BHL" style={{ height: '60px', objectFit: 'contain' }} />
        </Link>
        <h2 className={styles.title}>Welcome Back</h2>
        <p className={styles.sub}>Sign in to your Brotherhood account</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input className="form-input" required value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Username or Email" id="login-identifier" />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }} className="hover-link">Forgot?</Link>
            </div>
            <input className="form-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" id="login-password" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading} id="login-submit-btn">
            {loading ? <span className="spinner" /> : 'Login to BHL'}
          </button>
        </form>

        <p className={styles.link}>
          Don&apos;t have an account? <Link href="/register">Join the Brotherhood →</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
