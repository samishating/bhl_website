'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';
import LoadingScreen from '@/components/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, scaleIn, dropdownAnimation } from '@/lib/animations';

const AdminContext = createContext({
  refreshCounts: () => {},
  setGlobalLoading: (l: boolean) => {},
});

export const useAdmin = () => useContext(AdminContext);

interface AdminLink {
  href: string;
  label: string;
  icon: string;
  superOnly?: boolean;
}

export const adminLinks: AdminLink[] = [
  { href: '/admin', label: 'Overview', icon: '/ICONS/LEADERBOARD.svg' },
  { href: '/admin/members', label: 'Creators Settings', icon: '/ICONS/CREATORS SETTINGS.svg' },
  { href: '/admin/users', label: 'Users Settings', icon: '/ICONS/USER SETTINGS.svg', superOnly: true },
  { href: '/admin/xp', label: 'XP/Levels', icon: '/ICONS/XP.svg' },
  { href: '/admin/challenges', label: 'Challenges', icon: '/ICONS/trophy_1.svg' },
  { href: '/admin/submissions', label: 'Submissions', icon: '/ICONS/INBOX.svg' },
  { href: '/admin/applications', label: 'Applications', icon: '/ICONS/INBOX.svg' },
  { href: '/admin/products', label: 'Products', icon: '/ICONS/PRODUCTS.svg' },
  { href: '/admin/orders', label: 'Orders', icon: '/ICONS/LIST PRODUCTS.svg' },
  { href: '/admin/referrals', label: 'Referrals', icon: '/ICONS/REFERRALS.svg', superOnly: true },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [counts, setCounts] = useState({ pendingApplications: 0, pendingSubmissions: 0, pendingOrders: 0 });
  const [globalLoading, setGlobalLoading] = useState(false);
  const [countsLoading, setCountsLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
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

  // Protection for superadmin-only links
  const currentLink = adminLinks.find(l => l.href === pathname);
  if (currentLink?.superOnly && user?.role !== 'superadmin') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'Rajdhani', fontSize: '2.5rem', fontWeight: 800 }}>RESTRICTED ACCESS</h2>
        <p style={{ color: 'var(--text-muted)' }}>This sector requires Level 4 clearance (Superadmin).</p>
        <Link href="/admin" className="btn btn-primary">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ refreshCounts: fetchCounts, setGlobalLoading }}>
      <div className={styles.layout} style={{ 
        '--sidebar-width': isCollapsed ? '80px' : '280px' 
      } as any}>
        {(globalLoading || countsLoading) && (
          <LoadingScreen message="Syncing Dashboard..." />
        )}

        {/* Mobile Top Bar */}
        <div className={styles.mobileTopBar}>
          <button className={styles.menuToggle} onClick={() => setMobileNavOpen(true)}>☰</button>
          <div className={styles.mobileTitle}>{adminLinks.find(l => l.href === pathname)?.label || 'Admin'}</div>
        </div>

        {/* Sidebar Overlay */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div 
              className={styles.sidebarOverlay} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)} 
            />
          )}
        </AnimatePresence>

        <motion.aside 
          className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''} ${isCollapsed ? styles.sidebarCollapsed : ''}`}
          animate={{ width: isCollapsed ? 80 : 280 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        >
          <div style={{ position: 'relative', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', minHeight: '70px', overflow: 'hidden' }}>
            <Link href="/" className={styles.sidebarLogo}>
              <img src="/brand/logo.png" alt="BHL" style={{ height: '32px', objectFit: 'contain' }} />
                <motion.span
                  initial={false}
                  animate={{ 
                    opacity: isCollapsed ? 0 : 1,
                    width: isCollapsed ? 0 : 'auto',
                    marginLeft: isCollapsed ? 0 : 8
                  }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  BHL <span style={{ color: '#FFFDBA' }}>ADMIN</span>
                </motion.span>
            </Link>
            
            <button className={styles.closeSidebar} onClick={() => setMobileNavOpen(false)}>✕</button>
          </div>
          <nav className={styles.nav}>
            {adminLinks.filter(l => !l.superOnly || user?.role === 'superadmin').map(l => {
              let badgeCount = 0;
              if (l.label === 'Submissions') badgeCount = counts.pendingSubmissions;
              if (l.label === 'Applications') badgeCount = counts.pendingApplications;
              if (l.label === 'Orders') badgeCount = counts.pendingOrders;
              
              return (
                <Link key={l.href} href={l.href} className={`${styles.navLink} ${pathname === l.href ? styles.active : ''}`} id={`admin-nav-${l.label.toLowerCase()}`}>
                  <span className={styles.navIcon}>
                    {l.icon && l.icon.endsWith('.svg') ? (
                      <img src={l.icon} alt="" style={{ width: '22px', height: '22px' }} />
                    ) : (
                      l.icon || null
                    )}
                  </span> 
                  <motion.span
                    initial={false}
                    animate={{ 
                      opacity: isCollapsed ? 0 : 1,
                      width: isCollapsed ? 0 : 'auto',
                      marginLeft: isCollapsed ? 0 : 12
                    }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                  >
                    {l.label}
                  </motion.span>
                  {badgeCount > 0 && <span className={styles.notificationBadge}>{badgeCount}</span>}
                </Link>
              );
            })}
          </nav>
          <div className={styles.sidebarFooter}>
            <button 
              className={styles.collapseToggle} 
              onClick={toggleCollapse} 
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              style={{ 
                marginBottom: '1rem',
                width: '100%',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '0.5rem 0' : '0.5rem 1rem'
              }}
            >
              {isCollapsed ? '▶' : '◀ Collapse'}
            </button>
            <Link href="/" className={styles.backLink}>
              <motion.span
                animate={{ width: isCollapsed ? 20 : 'auto' }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'inline-block' }}
              >
                {isCollapsed ? '←' : '← Back to Site'}
              </motion.span>
            </Link>
          </div>
        </motion.aside>

        <main className={`${styles.main} ${isCollapsed ? styles.mainCollapsed : ''}`}>
          {children}
        </main>
      </div>
    </AdminContext.Provider>

  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}
