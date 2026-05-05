'use client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/app/(main)/merch/page.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const { isCartOpen, setCartOpen, items, count, total, removeItem, updateQuantity } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckoutClick = () => {
    setCartOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      {isCartOpen && (
        <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }} onClick={() => setCartOpen(false)}>
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
                    <div key={item.cartItemId} className={styles.cartItem}>
                      <div className={styles.cartItemImg}>
                        {item.image ? <img src={item.image} alt="" /> : item.name[0]}
                      </div>
                      <div className={styles.cartItemInfo}>
                        <div className={styles.cartItemName}>
                          {item.name}
                          {item.size && <span style={{ marginLeft: '6px', color: 'var(--brand-red)', fontSize: '0.85rem' }}>({item.size})</span>}
                        </div>
                        <div className={styles.cartItemPrice}>{(item.price * item.quantity).toFixed(2)} MAD</div>
                      </div>
                      <div className={styles.cartQty}>
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>+</button>
                      </div>
                      <button className={styles.removeItem} onClick={() => removeItem(item.cartItemId)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className={styles.cartFooter}>
                  <div className={styles.cartTotal}>Total: <span>{total.toFixed(2)} MAD</span></div>
                  {user ? (
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCheckoutClick}>
                      Proceed to Checkout →
                    </button>
                  ) : (
                    <Link href="/login" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => setCartOpen(false)}>
                      Login to Checkout <img src="/ICONS/CART.svg" alt="" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} />
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
