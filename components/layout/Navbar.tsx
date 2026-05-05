'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dropdownAnimation } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/merch', label: 'Merch' },
  { href: '/apply', label: 'Apply to Us' },
  { href: '/community', label: 'Community' },
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
    <div className={styles.navbarWrap}>
      <nav className={styles.navbar}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} onClick={handleLogoClick}>
            <Image
              src="/brand/logo.png"
              alt="BHL"
              width={120}
              height={40}
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
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
                  onClick={link.href === '/' ? handleLogoClick : undefined}
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
              <Image src="/ICONS/CART.svg" alt="Cart" width={20} height={20} style={{ opacity: 0.75 }} />
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
                    {user.avatar ? <Image src={user.avatar} alt={user.username} width={24} height={24} /> : user.username?.[0]?.toUpperCase() || 'U'}
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
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              className={styles.mobileMenu}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={dropdownAnimation}
            >
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
                  onClick={(e) => {
                    setMenuOpen(false);
                    if (link.href === '/') {
                      handleLogoClick(e as any);
                    }
                  }}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <div className="section-divider" style={{ margin: '0.5rem 0', opacity: 0.1 }} />
                  <Link href="/profile" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Profile</Link>
                  {(user.role === 'admin' || user.role === 'superadmin') && <Link href="/admin" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} className={styles.mobileLink}>Logout</button>
                </>
              ) : (
                <>
                  <div className="section-divider" style={{ margin: '0.5rem 0', opacity: 0.1 }} />
                  <Link href="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link href="/register" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Join Brotherhood</Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
