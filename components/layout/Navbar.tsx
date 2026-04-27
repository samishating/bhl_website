'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/divisions', label: 'Divisions' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/challenges', label: 'Challenges' },
  { href: '/merch', label: 'Merch' },
  { href: '/community', label: 'Coming Soon' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { count, setCartOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/divisions" className={styles.logo} onClick={handleLogoClick}>
          <Image 
            src="/brand/logo.png" 
            alt="BHL" 
            width={120} 
            height={40} 
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }} 
            priority 
          />
        </Link>

        {/* Desktop Nav */}
        <ul className={styles.navLinks}>
          {navLinks.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Cart */}
          <button 
            className={styles.cartBtn} 
            id="nav-cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Open shopping cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </button>

          {loading ? (
            <div className={styles.navLoading}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonText} />
            </div>
          ) : user ? (
            <div className={styles.userMenu}>
              <Link href="/profile" className={styles.userAvatarBtn} id="nav-profile-btn">
                <div className={`avatar ${styles.navAvatar}`}>
                  {user.avatar ? <Image src={user.avatar} alt={user.username} width={32} height={32} /> : user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className={styles.username}>{user.username}</span>
                <span className={`badge badge-blue ${styles.levelBadge}`}>Lv.{user.level}</span>
              </Link>
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <Link href="/admin" className="btn btn-sm btn-ghost" id="nav-admin-btn">Admin</Link>
              )}
              <button onClick={handleLogout} className="btn btn-sm btn-ghost" id="nav-logout-btn">Logout</button>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href={pathname === '/login' || pathname === '/register' ? '/login' : `/login?callbackUrl=${encodeURIComponent(pathname)}`} className="btn btn-ghost btn-sm" id="nav-login-btn">Login</Link>
              <Link href="/register" className="btn btn-primary btn-sm" id="nav-register-btn">Join</Link>
            </div>
          )}

          {/* Mobile Burger */}
          <button
            className={styles.burger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            id="nav-burger-btn"
          >
            <span className={menuOpen ? styles.burgerOpen : ''}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/profile" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Profile</Link>
              {(user.role === 'admin' || user.role === 'superadmin') && <Link href="/admin" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Admin</Link>}
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className={styles.mobileLink}>Logout</button>
            </>
          ) : (
            <>
              <Link href={pathname === '/login' || pathname === '/register' ? '/login' : `/login?callbackUrl=${encodeURIComponent(pathname)}`} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/register" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Join</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
