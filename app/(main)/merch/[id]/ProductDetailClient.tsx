'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import styles from './product.module.css';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  stock: number;
  sizes?: { size: string; stock: number }[];
  isLimitedDrop: boolean;
  category: string;
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [activeImg, setActiveImg] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const REQUIRED_XP = 40000;
  const isLocked = product.isLimitedDrop && (user?.xp || 0) < REQUIRED_XP;
  const hasSizes = product.sizes && product.sizes.length > 0;
  const isSoldOut = hasSizes ? product.sizes!.every(s => s.stock === 0) : product.stock === 0;
  
  const currentMaxStock = hasSizes 
    ? (product.sizes?.find(s => s.size === selectedSize)?.stock || 0)
    : product.stock;

  // Clamp quantity when stock changes
  useEffect(() => {
    if (quantity > currentMaxStock) {
      setQuantity(Math.max(1, currentMaxStock));
    }
    if (currentMaxStock > 0 && quantity === 0) {
      setQuantity(1);
    }
  }, [selectedSize, currentMaxStock, quantity]);

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);

  const handleAddToCart = () => {
    if (!user) {
      showToast('Please login to add items to your cart', 'error');
      return;
    }
    if (isLocked) {
      showToast('Insufficient XP for premium items', 'error');
      return;
    }
    if (hasSizes && !selectedSize) {
      showToast('Please select a size first', 'error');
      return;
    }
    if (quantity > currentMaxStock) {
      showToast(`Only ${currentMaxStock} items left in stock`, 'error');
      return;
    }

    addItem({ 
      id: product._id, 
      name: product.name, 
      price: product.price, 
      image: product.image, 
      size: selectedSize || undefined,
      quantity
    });
    showToast(`${quantity} x ${product.name} added to cart`, 'success');
  };

  return (
    <div className={styles.productPage}>
      <div className="container">
        <Link href="/merch" className={styles.backLink}>
          ← BACK TO SHOP
        </Link>

        <div className={styles.layout}>
          {/* LEFT: GALLERY */}
          <div className={styles.gallerySection}>
            <div className={styles.thumbnails}>
              {allImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.thumb} ${activeImg === idx ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImg(idx)}
                >
                  <img src={img} alt={`${product.name} gallery image ${idx + 1}`} />
                </div>
              ))}
            </div>
            <div 
              className={styles.mainImageContainer}
              onMouseMove={(e) => {
                const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - left) / width) * 100;
                const y = ((e.clientY - top) / height) * 100;
                setZoomPos({ x, y });
              }}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
            >
              <img 
                src={allImages[activeImg]} 
                alt={product.name} 
                className={styles.mainImage}
                style={{ 
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: isZooming ? 'scale(1.8)' : 'scale(1)',
                }}
              />
              {isLocked && (
                <div className={styles.lockedOverlay}>
                  <img src="/ICONS/trophy_1.svg" alt="Premium Exclusive Trophy Icon" style={{ width: '40px', height: '40px', marginBottom: '1rem' }} />
                  <span>PREMIUM EXCLUSIVE</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: INFO */}
          <div className={styles.infoSection}>
            <div className={styles.categoryTag}>{product.category}</div>
            <h1 className={styles.productName}>{product.name}</h1>
            <div className={styles.price}>{product.price.toFixed(2)} MAD</div>
            
            <div className={styles.descriptionSection}>
              <p>{product.description}</p>
            </div>

            {hasSizes && (
              <div className={styles.sizeSection}>
                <div className={styles.sizeHeader}>
                  <span>Size</span>
                  {selectedSize && <span style={{ color: 'var(--brand-red)' }}>{selectedSize}</span>}
                </div>
                <div className={styles.sizeGrid}>
                  {product.sizes!.map((s, idx) => {
                    const outOfStock = s.stock === 0;
                    return (
                      <button
                        key={idx}
                        className={`${styles.sizeBtn} ${selectedSize === s.size ? styles.sizeBtnActive : ''} ${outOfStock ? styles.sizeBtnSoldOut : ''}`}
                        onClick={() => !outOfStock && setSelectedSize(s.size)}
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

            <div className={styles.quantitySection}>
              <div className={styles.quantityHeader}>Quantity</div>
              <div className={styles.quantityControls}>
                <button 
                  className={styles.qtyBtn} 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isSoldOut}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button 
                  className={styles.qtyBtn} 
                  onClick={() => setQuantity(q => Math.min(currentMaxStock, q + 1))}
                  disabled={quantity >= currentMaxStock || isSoldOut}
                >
                  +
                </button>
              </div>
              <div className={styles.stockStatus}>
                {isSoldOut ? (
                  <span style={{ color: 'var(--brand-red)' }}>OUT OF STOCK</span>
                ) : (
                  <span>{currentMaxStock} available {hasSizes && selectedSize && `in size ${selectedSize}`}</span>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                className={`btn btn-primary btn-lg ${styles.buyBtn}`}
                onClick={handleAddToCart}
                disabled={isSoldOut || isLocked}
              >
                {isSoldOut ? 'SOLD OUT' : isLocked ? 'LOCKED (INSUFFICIENT XP)' : 'ADD TO CART'}
              </button>
              
              {isLocked && (
                <p className={styles.lockInfo}>
                  This item requires <strong>{REQUIRED_XP.toLocaleString()} XP</strong> to purchase. 
                  You currently have {user?.xp?.toLocaleString() || 0} XP.
                </p>
              )}
            </div>

            <div className={styles.specs}>
              <details open className={styles.specDetail}>
                <summary>Product Details</summary>
                <div className={styles.specContent}>
                  <ul>
                    <li>Official BHL Licensed Gear</li>
                    <li>Premium Athletic Fit</li>
                    <li>High-Density Print Detail</li>
                    <li>Designed for performance</li>
                  </ul>
                </div>
              </details>
              <details className={styles.specDetail}>
                <summary>Shipping & Returns</summary>
                <div className={styles.specContent}>
                  <p>Standard shipping: 3-5 business days. International shipping available. Returns accepted within 30 days of delivery.</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
