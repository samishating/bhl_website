'use client';
import { useState } from 'react';
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

  const REQUIRED_XP = 40000;
  const isLocked = product.isLimitedDrop && (user?.xp || 0) < REQUIRED_XP;
  const hasSizes = product.sizes && product.sizes.length > 0;
  const isSoldOut = hasSizes ? product.sizes!.every(s => s.stock === 0) : product.stock === 0;
  
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
    addItem({ id: product._id, name: product.name, price: product.price, image: product.image, size: selectedSize || undefined });
    showToast(`${product.name} added to cart`, 'success');
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
                  <img src={img} alt="" />
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
                  <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '40px', height: '40px', marginBottom: '1rem' }} />
                  <span>PREMIUM EXCLUSIVE</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: INFO */}
          <div className={styles.infoSection}>
            <div className={styles.categoryTag}>{product.category}</div>
            <h1 className={styles.productName}>{product.name}</h1>
            <div className={styles.price}>${product.price.toFixed(2)}</div>
            
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
