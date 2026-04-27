'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
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

export default function MerchPage() {
  const { user } = useAuth();
  const { addItem, items, count, total, removeItem, updateQuantity, clearCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [orderDone, setOrderDone] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImg, setActiveImg] = useState(0);

  const REQUIRED_XP = 40000;
  const isLocked = filter === 'drop' && (user?.xp || 0) < REQUIRED_XP;

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false); });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filtered = products.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'drop') return p.isLimitedDrop;
    return p.category === filter;
  });

  const handleAddToCart = (p: Product) => {
    if (!user) {
      showToast('❌ Please login to add items to cart');
      return;
    }
    addItem({ id: p._id, name: p.name, price: p.price, image: p.image });
    showToast(`🛒 ${p.name} added to cart!`);
  };

  const handleCheckout = () => {
    setCheckout(false);
    setOrderDone(true);
    clearCart();
  };

  return (
    <div className={styles.page}>
      {toast && <div className="toast">{toast}</div>}

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className={styles.cartOverlay} onClick={() => setCartOpen(false)}>
          <div className={styles.cart} onClick={e => e.stopPropagation()}>
            <div className={styles.cartHeader}>
              <h3>Your Cart ({count})</h3>
              <button onClick={() => setCartOpen(false)} className={styles.cartClose}>✕</button>
            </div>
            {items.length === 0 ? (
              <div className={styles.emptyCart}>Your cart is empty</div>
            ) : (
              <>
                <div className={styles.cartItems}>
                  {items.map(item => (
                    <div key={item.id} className={styles.cartItem}>
                      <div className={styles.cartItemImg}>{item.name[0]}</div>
                      <div className={styles.cartItemInfo}>
                        <div className={styles.cartItemName}>{item.name}</div>
                        <div className={styles.cartItemPrice}>${(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                      <div className={styles.cartQty}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button className={styles.removeItem} onClick={() => removeItem(item.id)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className={styles.cartFooter}>
                  <div className={styles.cartTotal}>Total: <span>${total.toFixed(2)}</span></div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setCartOpen(false); setCheckout(true); }} id="proceed-checkout-btn">
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkout && (
        <div className={styles.cartOverlay} onClick={() => setCheckout(false)}>
          <div className={styles.checkoutModal} onClick={e => e.stopPropagation()}>
            <h3>Checkout</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              This is a mock checkout. No real payment is processed.
            </p>
            <div className={styles.checkoutForm}>
              <input className="form-input" placeholder="Full Name" id="checkout-name" />
              <input className="form-input" placeholder="Email" id="checkout-email" />
              <input className="form-input" placeholder="Shipping Address" id="checkout-address" />
              <input className="form-input" placeholder="Card Number (mock)" id="checkout-card" />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input className="form-input" placeholder="MM/YY" id="checkout-expiry" />
                <input className="form-input" placeholder="CVV" id="checkout-cvv" />
              </div>
              <div className={styles.checkoutTotal}>Order Total: <strong>${total.toFixed(2)}</strong></div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCheckout} id="place-order-btn">
                Place Order (Mock)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className={styles.cartOverlay} onClick={() => { setSelectedProduct(null); setActiveImg(0); }}>
          <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
            <button className={styles.detailClose} onClick={() => { setSelectedProduct(null); setActiveImg(0); }}>✕</button>
            <div className={styles.detailGrid}>
              <div className={styles.detailGallery}>
                <div className={styles.mainDetailImg}>
                  <img src={[selectedProduct.image, ...(selectedProduct.images || [])][activeImg]} alt={selectedProduct.name} />
                </div>
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div className={styles.thumbGallery}>
                    {[selectedProduct.image, ...selectedProduct.images].map((img, idx) => (
                      <div key={idx} className={`${styles.thumb} ${activeImg === idx ? styles.thumbActive : ''}`} onClick={() => setActiveImg(idx)}>
                        <img src={img} alt="" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.detailInfo}>
                <div className={styles.productCategory}>{selectedProduct.category}</div>
                <h2 className={styles.detailName}>{selectedProduct.name}</h2>
                <div className={styles.detailPrice}>${selectedProduct.price.toFixed(2)}</div>
                <p className={styles.detailDescFull}>{selectedProduct.description}</p>
                <div className={styles.detailMeta}>
                  <span className={styles.stockStatus}>
                    {selectedProduct.stock > 0 ? `✅ In Stock (${selectedProduct.stock} units)` : '❌ Out of Stock'}
                  </span>
                  {selectedProduct.isLimitedDrop && <span className={styles.dropBadgeDetail}>🔥 Conqueror Exclusive</span>}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '2rem' }}
                  onClick={() => { handleAddToCart(selectedProduct); if(user) setSelectedProduct(null); }}
                  disabled={selectedProduct.stock === 0}
                >
                  {!user ? 'Login to Buy' : (selectedProduct.isLimitedDrop && (user?.xp || 0) < REQUIRED_XP) ? 'Locked (Need 40k XP)' : 'Add to Cart 🛒'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Success */}
      {orderDone && (
        <div className={styles.cartOverlay} onClick={() => setOrderDone(false)}>
          <div className={styles.successModal} onClick={e => e.stopPropagation()}>
            <div className={styles.successIcon}>🎉</div>
            <h3>Order Placed!</h3>
            <p>Your Brotherhood Legacy order is confirmed. You'll receive a confirmation (mock) shortly.</p>
            <button className="btn btn-primary" onClick={() => setOrderDone(false)}>Continue Shopping</button>
          </div>
        </div>
      )}

      <section className={styles.header}>
        <div className={styles.headerGlow} />
        <div className="container">
          <div className="section-tag">Official Store</div>
          <h1>BHL <span className="gradient-text">Merch</span></h1>
          <p className={styles.headerSub}>Rep the Brotherhood. Premium drops, limited editions, streetwear culture.</p>
        </div>
        <button
          className={styles.floatingCart}
          onClick={() => setCartOpen(true)}
          id="open-cart-btn"
        >
          🛒
          {count > 0 && <span className={styles.floatBadge}>{count}</span>}
        </button>
      </section>

      <div className="container">
        <div className={styles.tabs}>
          {['all', ...CATEGORIES.slice(1), 'drop'].map(c => (
            <button key={c} className={`${styles.tab} ${filter === c ? styles.tabActive : ''}`}
              onClick={() => setFilter(c)} id={`merch-tab-${c}`}>
              {c === 'drop' ? '🔥 Conqueror drops' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : isLocked ? (
          <div className={styles.locked}>
            <div className={styles.lockedIcon}>🔐</div>
            <h2 className={styles.lockedTitle}>Exclusive <span className="gradient-text">Access</span></h2>
            <p className={styles.lockedDesc}>
              Conqueror drops are reserved for our most dedicated members. 
              You need at least <strong>{REQUIRED_XP} XP</strong> to access this collection.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="xp-bar-container" style={{ width: '200px' }}>
                <div className="xp-bar-fill" style={{ width: `${Math.min(100, ((user?.xp || 0) / REQUIRED_XP) * 100)}%` }} />
              </div>
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--brand-red)' }}>
                {user?.xp || 0} / {REQUIRED_XP} XP
              </span>
            </div>
            <Link href="/challenges" className="btn btn-primary">
              Earn XP Now ⚔️
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No products in this category yet.</div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((p, i) => {
              const isItemLocked = p.isLimitedDrop && (user?.xp || 0) < REQUIRED_XP;
              return (
                <div key={p._id} className={`${styles.productCard} ${isItemLocked ? styles.productCardLocked : ''}`} 
                  style={{ animationDelay: `${i * 0.06}s`, cursor: isItemLocked ? 'default' : 'pointer' }} 
                  id={`product-${p._id}`}
                  onClick={() => { if(!isItemLocked) setSelectedProduct(p); }}
                >
                <div className={styles.productImg}>
                  {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : (
                    <div className={styles.productImgPlaceholder}>{p.name[0]}</div>
                  )}
                  {p.isLimitedDrop && <span className={styles.dropBadge}>🔥 Conqueror</span>}
                  {p.stock < 10 && p.stock > 0 && <span className={styles.stockBadge}>Only {p.stock} left</span>}
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productCategory}>{p.category}</div>
                  <h3 className={styles.productName}>{p.name}</h3>
                  <p className={styles.productDesc}>{p.description}</p>
                  <div className={styles.productFooter}>
                    <span className={styles.productPrice}>${p.price.toFixed(2)}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                      disabled={p.stock === 0}
                      id={`add-to-cart-${p._id}`}
                    >
                      {p.stock === 0 ? 'Sold Out' : !user ? 'Login to Buy' : (p.isLimitedDrop && (user?.xp || 0) < REQUIRED_XP) ? 'Need 40k XP 🔐' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
