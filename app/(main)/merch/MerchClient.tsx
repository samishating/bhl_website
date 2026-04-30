'use client';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import styles from './page.module.css';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  isLimitedDrop: boolean;
  category: string;
  images: string[];
}

const CATEGORIES = ['all', 'apparel', 'accessories', 'gear', 'digital'];

export default function MerchClient({ initialProducts }: { initialProducts: Product[] }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [filter, setFilter] = useState('all');
  const { showToast } = useToast();

  const REQUIRED_XP = 40000;
  const isLocked = filter === 'drop' && (user?.xp || 0) < REQUIRED_XP;

  const filtered = initialProducts.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'drop') return p.isLimitedDrop;
    return p.category === filter;
  });

  const handleAddToCart = (p: Product) => {
    if (!user) {
      showToast('Please login to add items to your cart', 'error');
      return;
    }
    if (p.isLimitedDrop && (user?.xp || 0) < REQUIRED_XP) {
      showToast('Insufficient XP for premium items', 'error');
      return;
    }
    addItem({ id: p._id, name: p.name, price: p.price, image: p.image });
  };

  return (
    <>
      <div className="animate-fade-up">
        <div className={styles.tabs}>
          {['all', ...CATEGORIES.slice(1), 'drop'].map(c => (
            <button key={c} className={`${styles.tab} ${filter === c ? styles.tabActive : ''}`}
              onClick={() => setFilter(c)} id={`merch-tab-${c}`}>
              {c === 'drop' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '16px', height: '16px', filter: filter === 'drop' ? 'none' : 'grayscale(1) opacity(0.5)' }} />
                  PREMIUM DROPS
                </span>
              ) : c.toUpperCase()}
            </button>
          ))}
        </div>

        {isLocked ? (
          <div className={styles.locked}>
            <div className={styles.lockedIcon}>
              <img src="/ICONS/trophy_1.svg" alt="Locked" style={{ width: '80px', height: '80px' }} />
            </div>
            <h2 className={styles.lockedTitle}>ACCESS <span className="gradient-text">DENIED</span></h2>
            <p className={styles.lockedDesc}>
              Premium drops are reserved for our most dedicated members. 
              You need at least <strong>{REQUIRED_XP} XP</strong> to access this exclusive collection.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <div className="xp-bar-container" style={{ width: '300px', height: '12px' }}>
                <div className="xp-bar-fill" style={{ width: `${Math.min(100, ((user?.xp || 0) / REQUIRED_XP) * 100)}%` }} />
              </div>
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--brand-red)', fontSize: '1.2rem' }}>
                {user?.xp?.toLocaleString() || 0} / {REQUIRED_XP.toLocaleString()} XP
              </span>
            </div>
            <Link href="/#challenges" className="btn btn-primary btn-lg">
              EARN XP NOW
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No items found</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((p, i) => {
              const isItemLocked = p.isLimitedDrop && (user?.xp || 0) < REQUIRED_XP;
              return (
                <Link key={p._id} href={isItemLocked ? '#' : `/merch/${p._id}`}
                  className={styles.productCard} 
                  style={{ animationDelay: `${i * 0.05}s`, cursor: isItemLocked ? 'default' : 'pointer' }} 
                  id={`product-${p._id}`}
                >
                <div className={styles.productImg}>
                  {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : (
                    <div className={styles.productImgPlaceholder}>{p.name[0]}</div>
                  )}
                  {p.isLimitedDrop && (
                    <span className={styles.dropBadge}>
                      <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '14px', height: '14px' }} />
                      Premium
                    </span>
                  )}
                  {p.stock < 10 && p.stock > 0 && <span className={styles.stockBadge}>ONLY {p.stock} REMAINING</span>}
                  {isItemLocked && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontFamily: 'Rajdhani', letterSpacing: '0.1em' }}>
                      LOCKED (INSUFFICIENT XP)
                    </div>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productCategory}>{p.category}</div>
                  <h3 className={styles.productName}>{p.name}</h3>
                  <p className={styles.productDesc}>{p.description}</p>
                  <div className={styles.productFooter}>
                    <span className={styles.productPrice}>${p.price.toFixed(2)}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(p); }}
                      disabled={p.stock === 0 || isItemLocked}
                      id={`add-to-cart-${p._id}`}
                    >
                      {p.stock === 0 ? 'SOLD OUT' : isItemLocked ? 'LOCKED' : (
                        <img src="/ICONS/CART.svg" alt="" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} />
                      )}
                    </button>
                  </div>
                </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
