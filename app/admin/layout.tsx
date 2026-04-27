'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

const AdminContext = createContext({
  refreshCounts: () => {},
  setGlobalLoading: (l: boolean) => {},
});

export const useAdmin = () => useContext(AdminContext);

const links = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/challenges', label: 'Challenges', icon: '🏆' },
  { href: '/admin/submissions', label: 'Challenges Inbox', icon: '📥' },
  { href: '/admin/applications', label: 'Applications Inbox', icon: '📝' },
  { href: '/admin/products', label: 'Products', icon: '👕' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [counts, setCounts] = useState({ pendingApplications: 0, pendingSubmissions: 0, pendingOrders: 0 });
  const [globalLoading, setGlobalLoading] = useState(false);
  const [countsLoading, setCountsLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (!data.error) {
        setCounts({
          pendingApplications: data.pendingApplications || 0,
          pendingSubmissions: data.pendingSubmissions || 0,
          pendingOrders: data.pendingOrders || 0
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      fetchCounts();
    }
  }, [user, fetchCounts]);

  if (authLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}><div className="spinner" /></div>;
  
  const isAuthorized = user?.role === 'admin' || user?.role === 'superadmin';
  
  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', gap: '1rem' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <Link href="/" className="btn btn-primary">Back to Site</Link>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ refreshCounts: fetchCounts, setGlobalLoading }}>
      <div className={styles.layout}>
        {(globalLoading || countsLoading) && (
          <div className={styles.globalOverlay}>
            <div className="spinner" />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading Dashboard...</p>
          </div>
        )}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLogo}>
            <img src="/brand/logo.png" alt="BHL Admin" style={{ height: '32px', objectFit: 'contain' }} />
          </div>
          <nav className={styles.nav}>
            {links.map(l => {
              let badgeCount = 0;
              if (l.label === 'Challenges Inbox') badgeCount = counts.pendingSubmissions;
              if (l.label === 'Applications Inbox') badgeCount = counts.pendingApplications;
              if (l.label === 'Orders') badgeCount = counts.pendingOrders;
              
              return (
                <Link key={l.href} href={l.href} className={`${styles.navLink} ${pathname === l.href ? styles.active : ''}`} id={`admin-nav-${l.label.toLowerCase()}`}>
                  <span>{l.icon}</span> {l.label}
                  {badgeCount > 0 && <span className={styles.notificationBadge}>{badgeCount}</span>}
                </Link>
              );
            })}
          </nav>
          <div className={styles.sidebarFooter}>
            <Link href="/" className={styles.backLink}>← Back to Site</Link>
          </div>
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </AdminContext.Provider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}
