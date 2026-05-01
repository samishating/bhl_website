'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './checkout.module.css';

export default function CheckoutClient() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', address: '' });
  const [dialCode, setDialCode] = useState('+33');
  const [phone, setPhone] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; assignedTo: string } | null>(null);
  const [showPromoPopup, setShowPromoPopup] = useState(false);

  // Pre-fill user info
  useEffect(() => {
    if (user) {
      setCustomerInfo(p => ({ ...p, email: user.email || '' }));
    }
  }, [user]);

  useEffect(() => {
    fetch('/api/countries').then(r => r.json()).then(d => {
      if (d.countries) setCountries(d.countries);
    }).catch(console.error);
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/merch');
    }
  }, [items, router]);

  const discountedTotal = appliedPromo
    ? parseFloat((total * (1 - appliedPromo.discount / 100)).toFixed(2))
    : total;

  const discountAmount = appliedPromo
    ? parseFloat((total - discountedTotal).toFixed(2))
    : 0;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch(`/api/referrals/validate?code=${encodeURIComponent(promoCode.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Invalid promo code', 'error');
        return;
      }
      setAppliedPromo({ code: data.code, discount: data.discountPercentage, assignedTo: data.assignedTo });
      setShowPromoPopup(true);
    } catch {
      showToast('Failed to validate promo code', 'error');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return showToast('Please enter your phone number', 'error');
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.id,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            size: i.size,
          })),
          total,
          referralCode: appliedPromo?.code || undefined,
          customerInfo: { ...customerInfo, phone: `${dialCode} ${phone}` },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        clearCart();
        router.push('/checkout/success');
      } else {
        showToast(data.error || 'Failed to place order', 'error');
      }
    } catch {
      showToast('Server error, please try again', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/merch" className={styles.back}>← Back to Shop</Link>

        <div className={styles.header}>
          <h1 className={styles.title}>Checkout</h1>
          <p className={styles.sub}>{items.length} item{items.length !== 1 ? 's' : ''} in your order</p>
        </div>

        <div className={styles.layout}>
          {/* LEFT: Form */}
          <div>
            {/* Promo Code */}
            <div className={styles.promoSection}>
              <div className={styles.promoTitle}>🏷️ Promo Code</div>
              {appliedPromo ? (
                <div className={styles.promoApplied}>
                  <span>✓</span>
                  <span><strong>{appliedPromo.code}</strong> — {appliedPromo.discount}% discount applied!</span>
                  <button
                    onClick={handleRemovePromo}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.7, fontSize: '1.1rem' }}
                  >✕</button>
                </div>
              ) : (
                <div className={styles.promoInputRow}>
                  <input
                    type="text"
                    className={`form-input ${styles.promoInput}`}
                    placeholder="Enter promo code..."
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                  >
                    {promoLoading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : 'APPLY'}
                  </button>
                </div>
              )}
            </div>

            {/* Shipping Info Form */}
            <div className={styles.formSection}>
              <div className={styles.sectionTitle}>Shipping Information</div>
              <form id="checkout-form" onSubmit={handleSubmit} className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input required className="form-input" placeholder="Your full name" value={customerInfo.name} onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input required type="email" className="form-input" placeholder="your@email.com" value={customerInfo.email} onChange={e => setCustomerInfo(p => ({ ...p, email: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Shipping Address *</label>
                  <textarea required className="form-input" rows={3} placeholder="Street, City, Country" style={{ resize: 'vertical', minHeight: '90px' }} value={customerInfo.address} onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select
                      className="form-input"
                      style={{ width: '160px', flexShrink: 0, cursor: 'pointer' }}
                      value={dialCode}
                      onChange={e => setDialCode(e.target.value)}
                    >
                      {countries.map(c => (
                        <option key={c.code} value={c.dial_code}>
                          {c.flag} {c.name} ({c.dial_code})
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      type="tel"
                      pattern="^[0-9\-\+\s\(\)]+$"
                      title="Please enter a valid phone number (digits, spaces, or + - () only)"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Phone number"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </form>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="btn btn-primary"
              style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginTop: '1.5rem' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : `CONFIRM ORDER — $${discountedTotal.toFixed(2)}`}
            </button>
          </div>

          {/* RIGHT: Order Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryTitle}>Order Summary</div>
            <div className={styles.itemList}>
              {items.map(item => (
                <div key={item.cartItemId} className={styles.summaryItem}>
                  <div className={styles.summaryImg}>
                    {item.image ? <img src={item.image} alt={item.name} /> : null}
                  </div>
                  <div className={styles.summaryItemInfo}>
                    <div className={styles.summaryItemName}>{item.name}</div>
                    <div className={styles.summaryItemMeta}>
                      Qty: {item.quantity}{item.size ? ` · Size: ${item.size}` : ''}
                    </div>
                  </div>
                  <div className={styles.summaryItemPrice}>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className={styles.divider} />

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {appliedPromo && (
                <div className={`${styles.totalRow} ${styles.discount}`}>
                  <span>Discount ({appliedPromo.code} — {appliedPromo.discount}%)</span>
                  <span>−${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.grand}`}>
                <span>Total</span>
                <span>${discountedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Code Success Popup */}
      {showPromoPopup && appliedPromo && (
        <div className={styles.promoPopupOverlay} onClick={() => setShowPromoPopup(false)}>
          <div className={styles.promoPopup} onClick={e => e.stopPropagation()}>
            <div className={styles.promoEmoji}>🎉</div>
            <div className={styles.promoPopupTitle}>Code Applied!</div>
            <div className={styles.promoPopupDesc}>
              Promo code <strong style={{ color: 'white' }}>{appliedPromo.code}</strong> is valid.
              You've unlocked a discount from the BHL team!
            </div>
            <div className={styles.promoDiscount}>−{appliedPromo.discount}%</div>
            <div className={styles.promoNewPrice}>
              New total: <span>${discountedTotal.toFixed(2)}</span>{' '}
              <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '0.85rem' }}>${total.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowPromoPopup(false)}>
              AWESOME, LET'S GO! →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
