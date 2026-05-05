'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { scaleIn, fadeUp } from '@/lib/animations';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import styles from '../auth.module.css';

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const result = await register(form.email, form.password, form.username);
    setLoading(false);
    if (result.success) {
      router.push('/profile');
      router.refresh();
    } else setError(result.error || 'Registration failed');
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <motion.div 
        className={styles.card}
        initial="hidden"
        animate="visible"
        variants={scaleIn}
      >
        <motion.div variants={fadeUp}>
          <Link href="/" className={styles.logo}>
            <img src="/brand/logo.png" alt="BHL" style={{ height: '60px', objectFit: 'contain' }} />
          </Link>
          <h2 className={styles.title}>Join the Brotherhood</h2>
          <p className={styles.sub}>Create your account and start your legacy</p>
        </motion.div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="YourLegacyName" id="register-username" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" id="register-email" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" id="register-password" />
          </div>
          <div className={styles.terms}>
            By joining, you agree to rep the Brotherhood with honor.
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading} id="register-submit-btn">
            {loading ? <span className="spinner" /> : '⚔ Create Account'}
          </button>
        </form>

        <p className={styles.link}>
          Already a member? <Link href="/login">Login →</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return <RegisterForm />;
}
