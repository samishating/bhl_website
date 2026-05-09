'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useAdmin } from '../layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import Modal from '@/components/Modal';

interface Referral {
  _id: string;
  code: string;
  discountPercentage: number;
  assignedTo: { _id: string; username: string; email: string; role: string };
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: string;
}

const defaultForm = { code: '', discountPercentage: 10, assignedTo: '' };

export default function AdminReferralsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { setGlobalLoading } = useAdmin();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/referrals').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([referralData, userData]) => {
      setReferrals(referralData.referrals || []);
      // Filter users to admin and superadmin only
      const admins = (userData.users || []).filter((u: AdminUser) => u.role === 'admin' || u.role === 'superadmin');
      setAdminUsers(admins);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.assignedTo) return showToast('All fields are required', 'error');
    setCreating(true);
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || 'Failed to create referral', 'error');
      
      const updated = await fetch('/api/admin/referrals').then(r => r.json());
      setReferrals(updated.referrals || []);
      setForm(defaultForm);
      setShowForm(false);
      showToast(`Referral code "${form.code.toUpperCase()}" created!`, 'success');
    } catch {
      showToast('Server error', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (referral: Referral) => {
    setGlobalLoading(true);
    try {
      await fetch(`/api/admin/referrals/${referral._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !referral.isActive }),
      });
      setReferrals(prev => prev.map(r => r._id === referral._id ? { ...r, isActive: !r.isActive } : r));
    } catch {
      showToast('Failed to update referral', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    setGlobalLoading(true);
    try {
      await fetch(`/api/admin/referrals/${id}`, { method: 'DELETE' });
      setReferrals(prev => prev.filter(r => r._id !== id));
      showToast(`Code "${code}" deleted`, 'success');
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const totalUsage = referrals.reduce((s, r) => s + r.usageCount, 0);
  const activeCodes = referrals.filter(r => r.isActive).length;

  return (
    <>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Referral Codes</h1>
            <p className={styles.sub}>Create and manage promo codes with commission tracking</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} id="create-referral-btn">
            + NEW CODE
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Codes</div>
            <div className={styles.statValue}>{referrals.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Codes</div>
            <div className={styles.statValue} style={{ color: '#4eff91' }}>{activeCodes}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Uses</div>
            <div className={styles.statValue}>{totalUsage}</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem' }}>
            <div className="loader-visual" style={{ margin: '0 auto' }}>
              <div className="loader-arc" />
              <img src="/brand/logo.png" alt="" className="loader-logo" />
            </div>
            <p className="loader-text" style={{ marginTop: '2rem' }}>Loading Referrals...</p>
          </div>
        ) : referrals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No referral codes yet</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <motion.table 
              className={styles.table}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Assigned To</th>
                  <th>Uses</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <motion.tr key={r._id} variants={fadeUp}>
                    <td><span className={styles.code}>{r.code}</span></td>
                    <td><span className={styles.discountBadge}>↓ {r.discountPercentage}%</span></td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'white' }}>{r.assignedTo?.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{r.assignedTo?.role}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: '1.2rem' }}>{r.usageCount}</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${r.isActive ? styles.active : styles.inactive}`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleToggle(r)}
                        >
                          {r.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(r._id, r.code)}
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          </div>
        )}
      </motion.div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Create Referral Code"
        footer={
          <>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>CANCEL</button>
            <button type="submit" form="referral-form" className="btn btn-primary" style={{ flex: 1 }} disabled={creating}>
              {creating ? <span className="spinner" /> : 'CREATE CODE'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Codes will be automatically uppercased</p>
        <form id="referral-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Promo Code *</label>
            <input
              required
              className="form-input"
              placeholder="e.g. BHL20, SUMMER25"
              value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Discount Percentage *</label>
            <input
              required
              type="number"
              min="1"
              max="100"
              className="form-input"
              value={form.discountPercentage}
              onChange={e => setForm(p => ({ ...p, discountPercentage: Number(e.target.value) }))}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Customer gets {form.discountPercentage}% off their total order
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign To *</label>
            <select
              required
              className="form-input"
              value={form.assignedTo}
              onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
            >
              <option value="">— Select Admin / Superadmin —</option>
              {adminUsers.map(u => (
                <option key={u._id} value={u._id}>
                  {u.username} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}
