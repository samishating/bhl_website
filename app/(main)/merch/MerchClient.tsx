'use client';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import Modal from '@/components/Modal';
import { Eye, Lock, Minus, Plus, ShoppingBag, Trophy } from 'lucide-react';
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
      <section className={styles.storefront}>
        <div className={styles.storefrontHeader}>
          <span className="section-tag">Store</span>
          <h2>Official Drops</h2>
          <p>Premium apparel and Brotherhood gear built for daily wear, event days, and limited member releases.</p>
        </div>

        <div className={`${styles.tabs} selection-pill-group`}>
          {['all', ...CATEGORIES.slice(1), 'drop'].map(c => (
            <button key={c} className={`${styles.tab} selection-pill ${filter === c ? 'selection-pill-active' : ''}`}
              onClick={() => setFilter(c)} id={`merch-tab-${c}`}>
              {c === 'drop' ? (
                <span className={styles.tabLabel}>
                  <Trophy size={16} />
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
              <div className={styles.lockedProgress}>
                <div className="xp-bar-container">
                  <div className="xp-bar-fill" style={{ width: `${Math.min(100, ((user?.xp || 0) / REQUIRED_XP) * 100)}%` }} />
                </div>
                <span>
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
              className={`${styles.grid} ${filtered.length < 3 ? styles.gridSparse : ''}`}
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
                        <div className={styles.lockedOverlay}>
                          <Lock size={18} />
                          LOCKED
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
                          {p.stock === 0 ? 'SOLD OUT' : isItemLocked ? 'LOCKED' : <><Eye size={18} /> QUICK VIEW</>}
                        </button>
                      </div>
                    </div>
                    <div className={styles.productInfo}>
                      <div className={styles.productCategory}>{p.category} / SHOP</div>
                      <div className={styles.productMetaRow}>
                        <h3 className={styles.productName}>{p.name}</h3>
                        <span className={styles.productPrice}>{p.price.toFixed(2)} MAD</span>
                      </div>
                    </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </section>

      <Modal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.name || 'Product Details'}
        maxWidth="800px"
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
            <div className={styles.quickViewLayout}>
              <div className={styles.quickViewImagePane}>
                <img src={p.image} alt={p.name} />
                {p.isLimitedDrop && (
                  <div className={styles.quickViewBadge}>
                    <Trophy size={14} />
                    Premium
                  </div>
                )}
              </div>

              <div className={styles.quickViewDetails}>
                <div className={styles.quickViewMeta}>{p.category} / SHOP</div>
                <h2 className={styles.quickViewTitle}>{p.name}</h2>
                <div className={styles.quickViewPrice}>{p.price.toFixed(2)} MAD</div>
                <div className={styles.quickViewNote}>Tax included. Shipping calculated at checkout.</div>

                <div className={styles.quickViewForm}>
                  {hasSizes && (
                    <div className={styles.sizeSection}>
                      <div className={styles.sizeHeader}>
                        <span>Size Selector</span>
                        {quickViewSize && <span>{quickViewSize}</span>}
                      </div>
                      <div className={styles.sizeGrid}>
                        {p.sizes!.map((s, idx) => {
                          const outOfStock = s.stock === 0;
                          return (
                            <button
                              key={idx}
                              className={`${styles.sizeBtn} ${quickViewSize === s.size ? styles.sizeBtnActive : ''} ${outOfStock ? styles.sizeBtnSoldOut : ''}`}
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

                  <div className={styles.quantityLabel}>Quantity</div>
                  <div className={styles.qtyControl}>
                    <button onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))} aria-label="Decrease quantity">
                      <Minus size={16} />
                    </button>
                    <span>{quickViewQty}</span>
                    <button onClick={() => {
                      const maxStock = hasSizes && quickViewSize 
                        ? p.sizes!.find(s => s.size === quickViewSize)?.stock || 0
                        : (hasSizes ? 99 : p.stock);
                      if (quickViewQty < maxStock) setQuickViewQty(quickViewQty + 1);
                    }} aria-label="Increase quantity">
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  {((hasSizes && quickViewSize) || (!hasSizes)) && (
                    <div className={styles.stockLine}>
                      <span className="status-dot status-online" />
                      {hasSizes 
                        ? `${p.sizes!.find(s => s.size === quickViewSize)?.stock || 0} units ready for dispatch`
                        : `${p.stock} units ready for dispatch`}
                    </div>
                  )}

                  <button 
                    className={`btn btn-primary ${styles.quickBuyBtn}`}
                    onClick={handleModalAddToCart}
                    disabled={isSoldOut || isLocked}
                  >
                    {isSoldOut ? 'SOLD OUT' : isLocked ? <><Lock size={18} /> LEVEL UP REQUIRED</> : <><ShoppingBag size={18} /> ADD TO SECURE CART</>}
                  </button>

                  <Link href={`/merch/${p._id}`} className={styles.viewFullLink} onClick={() => setQuickViewProduct(null)}>
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
