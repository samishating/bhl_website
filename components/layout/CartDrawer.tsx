'use client';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import styles from '@/app/(main)/merch/page.module.css';

export default function CartDrawer() {
  const { isCartOpen, setCartOpen, items, count, total, removeItem, updateQuantity, clearCart } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  const handleCheckout = () => {
    setCheckout(false);
    setOrderDone(true);
    clearCart();
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
              This is a mock checkout. No real payment is processed.
            </p>
            <div className={styles.checkoutForm}>
              <input className="form-input" placeholder="Full Name" />
              <input className="form-input" placeholder="Email" />
              <input className="form-input" placeholder="Shipping Address" />
              <input className="form-input" placeholder="Card Number (mock)" />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input className="form-input" placeholder="MM/YY" />
                <input className="form-input" placeholder="CVV" />
              </div>
              <div className={styles.checkoutTotal}>Order Total: <strong>${total.toFixed(2)}</strong></div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCheckout}>
                Place Order (Mock)
              </button>
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
    </>
  );
}
