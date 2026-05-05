'use client';
import { useState, useRef } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import Modal from '@/components/Modal';
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
  const tabsRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      <div className="container">
        <div className={`${styles.tabs} selection-pill-group`} ref={tabsRef}>
          {['all', ...CATEGORIES.slice(1), 'drop'].map(c => (
            <button key={c} className={`${styles.tab} selection-pill ${filter === c ? `selection-pill-active ${styles.tabActive}` : ''}`}
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
              {filter === c && (
                <motion.div 
                  layoutId="merchTab"
                  className="selection-pill-indicator"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>


        <AnimatePresence mode="wait">
          {isLocked ? (
            <motion.div 
              key="locked"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={styles.locked}
            >
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
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.empty}
            >
              <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No items found</p>
            </motion.div>
          ) : (
            <motion.div 
              key={`grid-${filter}`}
              className={styles.grid}
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {filtered.map((p) => {
                const isItemLocked = p.isLimitedDrop && (user?.xp || 0) < REQUIRED_XP;
                return (
                  <motion.div 
                    key={p._id}
                    variants={fadeUp}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Link href={isItemLocked ? '#' : `/merch/${p._id}`}
                      className={styles.productCard} 
                      style={{ cursor: isItemLocked ? 'default' : 'pointer' }} 
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
                      <span className={styles.productPrice}>${p.price.toFixed(2)} dh</span>
                    </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <Modal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.name || 'Product Details'}
        maxWidth="1000px"
        padding="0"
        footer={null}
      >
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
            <div style={{ display: 'flex', flexDirection: 'row', background: 'var(--bg-secondary)', minHeight: '500px' }}>
              {/* Left: Image Container */}
              <div style={{ flex: '1.2', background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border)' }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {p.isLimitedDrop && (
                  <div className={styles.dropBadge} style={{ top: '1.5rem', left: '1.5rem' }}>
                    <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '14px', height: '14px' }} />
                    Premium
                  </div>
                )}
              </div>

              {/* Right: Details Container */}
              <div style={{ flex: '1', padding: '2.5rem', position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  {p.category} | SHOP
                </div>
                <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.2rem', lineHeight: 1.1, color: 'white' }}>{p.name}</h2>
                <div style={{ fontFamily: 'Inter', fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--brand-red)', fontWeight: 700 }}>${p.price.toFixed(2)} dh</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Tax included. Shipping calculated at checkout.</div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', flex: 1 }}>
                  {hasSizes && (
                    <div className={styles.sizeSection} style={{ marginBottom: '1.5rem' }}>
                      <div className={styles.sizeHeader} style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Size Selector</span>
                        {quickViewSize && <span style={{ color: 'var(--brand-red)', fontWeight: 800 }}>{quickViewSize}</span>}
                      </div>
                      <div className={styles.sizeGrid}>
                        {p.sizes!.map((s, idx) => {
                          const outOfStock = s.stock === 0;
                          return (
                            <button
                              key={idx}
                              className={`${styles.sizeBtn} ${quickViewSize === s.size ? styles.sizeBtnActive : ''} ${outOfStock ? styles.sizeBtnSoldOut : ''}`}
                              style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
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

                  <div style={{ marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'Rajdhani', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Quantity</div>
                  <div className={styles.qtyControl} style={{ marginBottom: '1.5rem' }}>
                    <button onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}>−</button>
                    <span style={{ minWidth: '40px', textAlign: 'center' }}>{quickViewQty}</span>
                    <button onClick={() => {
                      const maxStock = hasSizes && quickViewSize 
                        ? p.sizes!.find(s => s.size === quickViewSize)?.stock || 0
                        : (hasSizes ? 99 : p.stock);
                      if (quickViewQty < maxStock) setQuickViewQty(quickViewQty + 1);
                    }}>+</button>
                  </div>
                  
                  {((hasSizes && quickViewSize) || (!hasSizes)) && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="status-dot" style={{ background: '#22c55e', width: '6px', height: '6px' }} />
                      {hasSizes 
                        ? `${p.sizes!.find(s => s.size === quickViewSize)?.stock || 0} units ready for dispatch`
                        : `${p.stock} units ready for dispatch`}
                    </div>
                  )}

                  <button 
                    className={`btn btn-primary ${styles.quickBuyBtn}`}
                    onClick={handleModalAddToCart}
                    disabled={isSoldOut || isLocked}
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                  >
                    {isSoldOut ? 'SOLD OUT' : isLocked ? 'LOCKED (LEVEL UP REQUIRED)' : 'ADD TO SECURE CART'}
                  </button>

                  <Link href={`/merch/${p._id}`} className={styles.viewFullLink} onClick={() => setQuickViewProduct(null)} style={{ marginTop: '1.5rem', display: 'block', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>
                    EXPLORE FULL SPECIFICATIONS
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
