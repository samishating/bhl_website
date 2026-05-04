'use client';
import { useState, useEffect, useRef } from 'react';
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
  sizes?: { size: string; stock: number }[];
}

const CATEGORIES = ['all', 'apparel', 'accessories', 'gear', 'digital'];

export default function MerchClient({ initialProducts }: { initialProducts: Product[] }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [filter, setFilter] = useState('all');
  const { showToast } = useToast();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewSize, setQuickViewSize] = useState<string | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  const REQUIRED_XP = 40000;
  const isLocked = filter === 'drop' && (user?.xp || 0) < REQUIRED_XP;

  const filtered = initialProducts.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'drop') return p.isLimitedDrop;
    return p.category === filter;
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      const activeTab = tabsRef.current?.querySelector(`.${styles.tabActive}`) as HTMLElement;
      if (activeTab) {
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth
        });
      }
    }
  }, [filter, hasMounted]);

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
        <div className={styles.tabs} ref={tabsRef}>
          {hasMounted && (
            <div 
              className={styles.indicator} 
              style={{ 
                left: `${indicatorStyle.left}px`, 
                width: `${indicatorStyle.width}px` 
              }} 
            />
          )}
          {['all', ...CATEGORIES.slice(1), 'drop'].map(c => (
            <button key={c} className={`${styles.tab} ${filter === c ? styles.tabActive : ''}`}
              onClick={() => setFilter(c)} id={`merch-tab-${c}`}>
              {c === 'drop' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src="/ICONS/trophy_1.svg" alt="" style={{ 
                    width: '20px', 
                    height: '20px', 
                    filter: filter === 'drop' ? 'brightness(0) invert(1)' : 'grayscale(1) opacity(0.5)' 
                  }} />
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
                  {p.image ? (
                    <>
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        loading="lazy" 
                        className={`${styles.primaryImg} ${p.images && p.images.length > 0 ? styles.hasSecondary : ''}`} 
                      />
                      {p.images && p.images.length > 0 && (
                        <img 
                          src={p.images[0]} 
                          alt={`${p.name} alternate`} 
                          loading="lazy" 
                          className={styles.secondaryImg} 
                        />
                      )}
                    </>
                  ) : (
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
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontFamily: 'Rajdhani', letterSpacing: '0.1em', zIndex: 20 }}>
                      LOCKED (INSUFFICIENT XP)
                    </div>
                  )}
                  <div className={styles.quickViewOverlay}>
                    <button
                      className={styles.quickViewBtn}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        setQuickViewProduct(p); 
                        setQuickViewSize(null); 
                        setQuickViewQty(1); 
                      }}
                      disabled={p.stock === 0 || isItemLocked}
                    >
                      {p.stock === 0 ? 'SOLD OUT' : isItemLocked ? 'LOCKED' : 'QUICK VIEW ↗'}
                    </button>
                  </div>
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productCategory}>{p.category} | SHOP</div>
                  <h3 className={styles.productName}>{p.name}</h3>
                  <span className={styles.productPrice}>${p.price.toFixed(2)}</span>
                </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {quickViewProduct && (() => {
        const p = quickViewProduct;
        const isLocked = p.isLimitedDrop && (user?.xp || 0) < REQUIRED_XP;
        const hasSizes = p.sizes && p.sizes.length > 0;
        const isSoldOut = hasSizes ? p.sizes!.every(s => s.stock === 0) : p.stock === 0;

        const handleModalAddToCart = () => {
          if (!user) return showToast('Please login to add items to your cart', 'error');
          if (isLocked) return showToast('Insufficient XP for premium items', 'error');
          if (hasSizes && !quickViewSize) return showToast('Please select a size', 'error');
          
          addItem({ id: p._id, name: p.name, price: p.price, image: p.image, size: quickViewSize || undefined, quantity: quickViewQty });
          showToast(`${p.name} added to cart`, 'success');
          setQuickViewProduct(null);
        };

        return (
          <div className="modal-overlay" onClick={() => setQuickViewProduct(null)}>
            <div 
              className="modal-content" 
              style={{ maxWidth: '900px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'row', background: 'var(--bg-secondary)' }} 
              onClick={e => e.stopPropagation()}
            >
              {/* Left: Image Container */}
              <div style={{ flex: '1.2', background: '#e0e0e0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Right: Details Container */}
              <div style={{ flex: '1', padding: '3rem', position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                <button onClick={() => setQuickViewProduct(null)} className="btn-close" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>✕</button>
                
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  {p.category} | SHOP
                </div>
                <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: '2.5rem', marginBottom: '0.2rem', lineHeight: 1 }}>{p.name}</h2>
                <div style={{ fontFamily: 'Inter', fontSize: '1.2rem', marginBottom: '0.5rem' }}>${p.price.toFixed(2)} dh</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '2rem' }}>Tax included.</div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', flex: 1 }}>
                  {hasSizes && (
                    <div className={styles.sizeSection}>
                      <div className={styles.sizeHeader} style={{ fontSize: '0.9rem' }}>
                        <span>Size</span>
                        {quickViewSize && <span style={{ color: 'var(--brand-red)' }}>{quickViewSize}</span>}
                      </div>
                      <div className={styles.sizeGrid}>
                        {p.sizes!.map((s, idx) => {
                          const outOfStock = s.stock === 0;
                          return (
                            <button
                              key={idx}
                              className={`${styles.sizeBtn} ${quickViewSize === s.size ? styles.sizeBtnActive : ''} ${outOfStock ? styles.sizeBtnSoldOut : ''}`}
                              style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => {
                                if (!outOfStock) {
                                  setQuickViewSize(s.size);
                                  if (quickViewQty > s.stock) setQuickViewQty(s.stock);
                                }
                              }}
                              disabled={outOfStock}
                              title={outOfStock ? 'Out of stock' : `${s.stock} left`}
                            >
                              {s.size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'Rajdhani', letterSpacing: '0.05em' }}>Quantity</div>
                  <div className={styles.qtyControl}>
                    <button onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}>−</button>
                    <span>{quickViewQty}</span>
                    <button onClick={() => {
                      const maxStock = hasSizes && quickViewSize 
                        ? p.sizes!.find(s => s.size === quickViewSize)?.stock || 0
                        : (hasSizes ? 99 : p.stock); // If no size selected yet, don't hard limit, it will be caught on add to cart or size select
                      if (quickViewQty < maxStock) setQuickViewQty(quickViewQty + 1);
                    }}>+</button>
                  </div>
                  {((hasSizes && quickViewSize) || (!hasSizes)) && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                      {hasSizes 
                        ? `${p.sizes!.find(s => s.size === quickViewSize)?.stock || 0} available in size ${quickViewSize}`
                        : `${p.stock} available`}
                    </div>
                  )}

                  <button 
                    className={`btn btn-primary ${styles.quickBuyBtn}`}
                    onClick={handleModalAddToCart}
                    disabled={isSoldOut || isLocked}
                  >
                    {isSoldOut ? 'SOLD OUT' : isLocked ? 'LOCKED' : 'ADD TO CART'}
                  </button>

                  <Link href={`/merch/${p._id}`} className={styles.viewFullLink} onClick={() => setQuickViewProduct(null)}>
                    VIEW FULL PRODUCT
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
