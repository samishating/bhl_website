'use client';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import styles from '@/app/(main)/merch/page.module.css';

export default function CartDrawer() {
  const { isCartOpen, setCartOpen, items, count, total, removeItem, updateQuantity, clearCart } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', address: '' });
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
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
            price: i.price
          })),
          total,
          customerInfo
        })
      });

      if (res.ok) {
        setCheckout(false);
        setOrderDone(true);
        clearCart();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
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
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setCartOpen(false); setCheckout(true); }}>
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {checkout && (
        <div className={styles.cartOverlay} onClick={() => setCheckout(false)}>
          <div className={styles.checkoutModal} onClick={e => e.stopPropagation()}>
            <h3>Checkout</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Confirm your shipping details to place your order.
            </p>
            <form onSubmit={handleCheckout} className={styles.checkoutForm}>
              <input 
                required 
                className="form-input" 
                placeholder="Full Name" 
                value={customerInfo.name}
                onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))}
              />
              <input 
                required 
                type="email" 
                className="form-input" 
                placeholder="Email Address" 
                value={customerInfo.email}
                onChange={e => setCustomerInfo(p => ({ ...p, email: e.target.value }))}
              />
              <textarea 
                required 
                className="form-input" 
                placeholder="Shipping Address" 
                rows={3}
                style={{ resize: 'vertical' }}
                value={customerInfo.address}
                onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))}
              />
              <div className={styles.checkoutTotal}>Order Total: <strong>${total.toFixed(2)}</strong></div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Confirm Order'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Success */}
      {orderDone && (
        <div className={styles.cartOverlay} onClick={() => setOrderDone(false)}>
          <div className={styles.successModal} onClick={e => e.stopPropagation()}>
            <div className={styles.successIcon}>🎉</div>
            <h3>Order Placed!</h3>
            <p>Your Brotherhood Legacy order is confirmed. You can view your orders in your dashboard.</p>
            <button className="btn btn-primary" onClick={() => setOrderDone(false)}>Continue Shopping</button>
          </div>
        </div>
      )}
    </>
  );
}
