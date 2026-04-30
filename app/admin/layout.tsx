'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';
import LoadingScreen from '@/components/LoadingScreen';

const AdminContext = createContext({
  refreshCounts: () => {},
  setGlobalLoading: (l: boolean) => {},
});

export const useAdmin = () => useContext(AdminContext);

const links = [
  { href: '/admin', label: 'Overview', icon: '/ICONS/LEADERBOARD.svg' },
  { href: '/admin/users', label: 'Users', icon: '/ICONS/USER.svg' },
  { href: '/admin/challenges', label: 'Challenges', icon: '/ICONS/trophy_1.svg' },
  { href: '/admin/submissions', label: 'Submissions', icon: '/ICONS/INBOX.svg' },
  { href: '/admin/applications', label: 'Applications', icon: '/ICONS/INBOX.svg' },
  { href: '/admin/products', label: 'Products', icon: '/ICONS/PRODUCTS.svg' },
  { href: '/admin/orders', label: 'Orders', icon: '/ICONS/LIST PRODUCTS.svg' },
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

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    if (saved === 'true') setIsCollapsed(true);
  }, []);

  // Save collapse state
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', newState.toString());
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      fetchCounts();
    }
  }, [user, fetchCounts]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (authLoading) return <LoadingScreen message="Verifying Identity..." />;
  
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
          <LoadingScreen message="Syncing Dashboard..." />
        )}

        {/* Mobile Top Bar */}
        <div className={styles.mobileTopBar}>
          <button className={styles.menuToggle} onClick={() => setMobileNavOpen(true)}>☰</button>
          <div className={styles.mobileTitle}>{links.find(l => l.href === pathname)?.label || 'Admin'}</div>
        </div>

        {/* Sidebar Overlay */}
        {mobileNavOpen && <div className={styles.sidebarOverlay} onClick={() => setMobileNavOpen(false)} />}

        <aside className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''} ${isCollapsed ? styles.sidebarCollapsed : ''}`}>
          <div style={{ position: 'relative', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', minHeight: '70px' }}>
            <Link href="/" className={styles.sidebarLogo}>
              <img src="/brand/logo.webp" alt="BHL" style={{ height: '32px', objectFit: 'contain' }} />
              <span>BHL <span style={{ color: '#FFFDBA' }}>ADMIN</span></span>
            </Link>
            
            <button 
              className={styles.collapseToggle} 
              onClick={toggleCollapse} 
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              style={{ 
                position: 'absolute', 
                right: isCollapsed ? '-12px' : '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 100,
                background: isCollapsed ? 'var(--bg-secondary)' : 'transparent',
                border: isCollapsed ? '1px solid var(--border)' : 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px'
              }}
            >
              {isCollapsed ? '▶' : '◀'}
            </button>
            <button className={styles.closeSidebar} onClick={() => setMobileNavOpen(false)}>✕</button>
          </div>
          <nav className={styles.nav}>
            {links.map(l => {
              let badgeCount = 0;
              if (l.label === 'Submissions') badgeCount = counts.pendingSubmissions;
              if (l.label === 'Applications') badgeCount = counts.pendingApplications;
              if (l.label === 'Orders') badgeCount = counts.pendingOrders;
              
              return (
                <Link key={l.href} href={l.href} className={`${styles.navLink} ${pathname === l.href ? styles.active : ''}`} id={`admin-nav-${l.label.toLowerCase()}`}>
                  <span className={styles.navIcon}>
                    {l.icon.endsWith('.svg') ? (
                      <img src={l.icon} alt="" style={{ width: '22px', height: '22px' }} />
                    ) : (
                      l.icon
                    )}
                  </span> 
                  <span>{l.label}</span>
                  {badgeCount > 0 && <span className={styles.notificationBadge}>{badgeCount}</span>}
                </Link>
              );
            })}
          </nav>
          <div className={styles.sidebarFooter}>
            <Link href="/" className={styles.backLink}>← Back to Site</Link>
          </div>
        </aside>
        <main className={`${styles.main} ${isCollapsed ? styles.mainCollapsed : ''}`}>{children}</main>
      </div>
    </AdminContext.Provider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}
