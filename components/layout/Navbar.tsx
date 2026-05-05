'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import styles from './Navbar.module.css';

const homeSections = [
  { href: '/#hero', id: 'hero', label: 'Home' },
  { href: '/#divisions', id: 'divisions', label: 'Divisions' },
  { href: '/#leaderboard', id: 'leaderboard', label: 'Leaderboard' },
  { href: '/#challenges', id: 'challenges', label: 'Challenges' },
];

const externalLinks = [
  { href: '/merch', label: 'Merch' },
  { href: '/apply', label: 'Apply to Us' },
  { href: '/coming-soon', label: 'Coming Soon' },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { count, setCartOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    // Scroll spy only — no hide logic
    const handleScroll = () => {
      if (pathname !== '/') return;
      const sections = ['hero', 'divisions', 'leaderboard', 'challenges'];
      const scrollPos = window.scrollY + 100;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const offset = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= offset && scrollPos < offset + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

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
              src="/brand/logo.webp"
              alt="BHL"
              width={120}
              height={40}
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <ul className={styles.navLinks}>
            {/* Dynamic Home Sections Dropdown */}
            <li 
              className={`${styles.dynamicSlot} ${pathname === '/' ? styles.activeSlot : ''}`}
              onMouseEnter={() => setHomeDropdownOpen(true)}
              onMouseLeave={() => setHomeDropdownOpen(false)}
            >
              <div className={styles.dynamicLabelWrapper}>
                <div className={styles.dynamicLabelInner}>
                  {homeSections.map((sec) => (
                    <span 
                      key={sec.id}
                      className={`${styles.dynamicLabel} ${(pathname === '/' && activeSection === sec.id) || (pathname !== '/' && sec.id === 'hero') ? styles.dynamicLabelActive : styles.dynamicLabelHidden}`}
                    >
                      {sec.label}
                    </span>
                  ))}
                </div>
                <svg className={`${styles.dropdownIcon} ${homeDropdownOpen ? styles.dropdownIconOpen : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {/* Dropdown Menu */}
              <div className={`${styles.dropdownMenu} ${homeDropdownOpen ? styles.dropdownMenuOpen : ''}`}>
                {homeSections.map(link => (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`${styles.dropdownLink} ${pathname === '/' && activeSection === link.id ? styles.dropdownLinkActive : ''}`}
                    onClick={(e) => {
                      setHomeDropdownOpen(false);
                      if (pathname === '/') {
                        e.preventDefault();
                        document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' });
                        window.history.pushState(null, '', link.href);
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </li>

            {/* External Links */}
            {externalLinks.map(link => (
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

        {/* Mobile Menu — floats below the capsule */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            {homeSections.map(link => (
              <Link
                key={link.id}
                href={link.href}
                className={`${styles.mobileLink} ${pathname === '/' && activeSection === link.id ? styles.active : ''}`}
                onClick={(e) => {
                  setMenuOpen(false);
                  if (pathname === '/') {
                    e.preventDefault();
                    document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', link.href);
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
            {externalLinks.map(link => (
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
    </div>
  );
}
