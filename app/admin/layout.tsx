'use client';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

const links = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/challenges', label: 'Challenges', icon: '🏆' },
  { href: '/admin/submissions', label: 'Challenges Inbox', icon: '📥' },
  { href: '/admin/applications', label: 'Applications Inbox', icon: '📝' },
  { href: '/admin/products', label: 'Products', icon: '👕' },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}><div className="spinner" /></div>;
  
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
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <img src="/brand/logo.png" alt="BHL Admin" style={{ height: '32px', objectFit: 'contain' }} />
        </div>
        <nav className={styles.nav}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`${styles.navLink} ${pathname === l.href ? styles.active : ''}`} id={`admin-nav-${l.label.toLowerCase()}`}>
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backLink}>← Back to Site</Link>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><AdminLayoutInner>{children}</AdminLayoutInner></AuthProvider>;
}
