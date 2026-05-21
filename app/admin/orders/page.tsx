'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../AdminLayoutClient';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, scaleIn } from '@/lib/animations';
import Modal from '@/components/Modal';
import styles from './page.module.css';

interface Order {
  _id: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number; size?: string }>;
  total: number;
  referralCode?: string;
  discountApplied?: number;
  customerInfo: { name: string; email: string; address: string; phone: string };
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  processedBy?: { username: string };
  processedAt?: string;
  createdAt: string;
}

interface Referral {
  _id: string;
  code: string;
  discountPercentage: number;
  assignedTo?: { username: string };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [productStocks, setProductStocks] = useState<Record<string, any>>({});
  const [searchCode, setSearchCode] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showThisMonthOnly, setShowThisMonthOnly] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { refreshCounts, setGlobalLoading } = useAdmin();

  // Fetch current stock levels when an order is selected
  useEffect(() => {
    if (selectedOrder) {
      const fetchStock = async () => {
        const uniqueIds = Array.from(new Set(selectedOrder.items.map(i => i.productId)));
        const stocks: Record<string, any> = {};
        await Promise.all(uniqueIds.map(async (id) => {
          try {
            const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.product) stocks[id.toString()] = data.product;
          } catch (err) { console.error(err); }
        }));
        setProductStocks(stocks);
      };
      fetchStock();
    } else {
      setProductStocks({});
    }
  }, [selectedOrder]);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/admin/referrals', { cache: 'no-store' }).then(r => r.json()),
    ]).then(([orderData, referralData]) => {
      setOrders(orderData.orders || []);
      setReferrals(referralData.referrals || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled') => {
    setGlobalLoading(true);
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const r = await fetch('/api/orders', { cache: 'no-store' });
        const d = await r.json();
        setOrders(d.orders || []);
      } else {
        refreshCounts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setGlobalLoading(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: editItems })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      
      setOrders(prev => prev.map(o => o._id === selectedOrder._id ? data.order : o));
      setSelectedOrder(data.order);
      setIsEditing(false);
      showToast('Order parameters synchronized!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Filter logic
  const filtered = orders.filter(o => {
    const matchesReferral = !activeFilter || o.referralCode === activeFilter;
    if (!matchesReferral) return false;
    
    if (showThisMonthOnly) {
      const now = new Date();
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    
    return true;
  });

  // Suggestions: filter referrals by search input and enrich with count
  const enriched = referrals.map(r => ({
    ...r,
    count: orders.filter(o => o.referralCode === r.code).length,
  }));

  const suggestions = enriched.filter(r =>
    searchCode.trim() === '' || r.code.toLowerCase().includes(searchCode.toLowerCase())
  );

  const selectCode = (code: string) => {
    setActiveFilter(code);
    setSearchCode(code);
    setShowSuggestions(false);
  };

  const clearFilter = () => {
    setActiveFilter(null);
    setSearchCode('');
    setShowSuggestions(false);
  };

  const promoCount = orders.filter(o => !!o.referralCode).length;

  return (
    <>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Order Management</h1>
            <p className={styles.sub}>
              {orders.filter(o => o.status === 'pending').length} pending • {filtered.length} matching filters
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
            {/* Timeframe Selection */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                Timeframe
              </label>
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)', height: '42px', minWidth: '200px' }}>
                <button 
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setShowThisMonthOnly(false)}
                  style={{ 
                    flex: 1,
                    background: !showThisMonthOnly ? 'var(--brand-red)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                    transition: '0.2s ease'
                  }}
                >
                  ALL TIME
                </button>
                <button 
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setShowThisMonthOnly(true)}
                  style={{ 
                    flex: 1,
                    background: showThisMonthOnly ? 'var(--brand-red)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                    transition: '0.2s ease'
                  }}
                >
                  THIS MONTH
                </button>
              </div>
            </div>

            {/* Referral Code Search Field */}
            <div ref={searchRef} style={{ position: 'relative', width: '280px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                Filter by Referral Code
              </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: activeFilter ? '2.5rem' : '0.875rem', fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: activeFilter ? '0.12em' : 'normal', color: activeFilter ? '#4eff91' : 'white' }}
                placeholder="Search codes..."
                value={searchCode}
                onChange={e => { setSearchCode(e.target.value); setActiveFilter(null); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
              />
              {(searchCode || activeFilter) && (
                <button
                  onClick={clearFilter}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.2rem' }}
                  title="Clear filter"
                >✕</button>
              )}
            </div>

          <AnimatePresence>
            {showSuggestions && (
              <motion.div 
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={scaleIn}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  zIndex: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  transformOrigin: 'top center'
                }}
              >
                {/* "All Orders" option */}
                <button
                  onClick={clearFilter}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: !activeFilter ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    color: !activeFilter ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'Rajdhani',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textAlign: 'left',
                  }}
                >
                  <span>All Orders</span>
                  <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>{orders.length}</span>
                </button>

                {suggestions.length === 0 ? (
                  <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', fontFamily: 'Rajdhani' }}>
                    No matching codes
                  </div>
                ) : (
                  suggestions.map(r => (
                    <button
                      key={r._id}
                      onClick={() => selectCode(r.code)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: activeFilter === r.code ? 'rgba(0,255,100,0.06)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: '0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = activeFilter === r.code ? 'rgba(0,255,100,0.06)' : 'transparent')}
                    >
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.12em', color: activeFilter === r.code ? '#4eff91' : 'white' }}>
                          {r.code}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {r.discountPercentage}% off{r.assignedTo ? ` · ${r.assignedTo.username}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                        <span style={{
                          background: r.count > 0 ? 'rgba(0,255,100,0.12)' : 'rgba(255,255,255,0.06)',
                          color: r.count > 0 ? '#4eff91' : 'var(--text-muted)',
                          border: `1px solid ${r.count > 0 ? 'rgba(0,255,100,0.25)' : 'var(--border)'}`,
                          borderRadius: '999px',
                          padding: '0.1rem 0.6rem',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          fontFamily: 'Rajdhani',
                        }}>
                          {r.count} order{r.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>

        {/* Active filter pill */}
        {activeFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 700, textTransform: 'uppercase' }}>Showing orders for:</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(0,255,100,0.08)', border: '1px solid rgba(0,255,100,0.25)',
              borderRadius: '999px', padding: '0.3rem 0.9rem',
              fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.12em', color: '#4eff91',
            }}>
              {activeFilter}
              <button onClick={clearFilter} style={{ background: 'none', border: 'none', color: '#4eff91', cursor: 'pointer', opacity: 0.7, padding: 0, lineHeight: 1 }}>✕</button>
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Rajdhani' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '10rem' }}>
            <div className="loader-visual" style={{ margin: '0 auto' }}>
              <div className="loader-arc" />
              <img src="/brand/logo.png" alt="" className="loader-logo" />
            </div>
            <p className="loader-text" style={{ marginTop: '2rem' }}>Loading Orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {activeFilter ? `No orders found for code: ${activeFilter}` : 'No logistics data found'}
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Promo</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {o._id.slice(-8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'white' }}>{o.customerInfo.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customerInfo.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{o.items.length} Units</div>
                    </td>
                    <td>
                      {o.referralCode ? (
                        <span style={{
                          fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em',
                          color: '#4eff91', background: 'rgba(0,255,100,0.08)', border: '1px solid rgba(0,255,100,0.2)',
                          padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer',
                        }} onClick={() => selectCode(o.referralCode!)}>
                          {o.referralCode}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--neon-blue)', fontFamily: 'Rajdhani', fontSize: '1.1rem' }}>
                        {o.total.toFixed(2)} MAD
                      </span>
                      {o.discountApplied && (
                        <div style={{ fontSize: '0.65rem', color: '#4eff91', fontWeight: 700 }}>−{o.discountApplied}% applied</div>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[o.status]}`}>{o.status}</span>
                      {o.processedBy && (
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: 700 }}>
                          BY: {o.processedBy.username.toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(o)}>DETAILS</button>
                        {o.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(o._id, 'confirmed')}>CONFIRM</button>
                        )}
                        {o.status === 'confirmed' && (
                          <button className="btn btn-primary btn-sm" style={{ background: '#22c55e', borderColor: '#22c55e' }} onClick={() => handleStatusUpdate(o._id, 'shipped')}>SHIP</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>


      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => { setSelectedOrder(null); setIsEditing(false); }}
          title={isEditing ? 'Modify Order' : 'Order Details'}
          maxWidth="560px"
          footer={
            isEditing ? (
              <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>CANCEL</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdateOrder}>SAVE CHANGES</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedOrder(null)}>CLOSE</button>
                
                {selectedOrder.status === 'pending' && (
                  <>
                    <button 
                      className="btn btn-ghost" 
                      style={{ flex: 1, color: 'var(--brand-red)' }}
                      onClick={() => { handleStatusUpdate(selectedOrder._id, 'cancelled'); setSelectedOrder(null); }}
                    >
                      CANCEL ORDER
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                      onClick={() => { handleStatusUpdate(selectedOrder._id, 'confirmed'); setSelectedOrder(null); }}
                    >
                      CONFIRM ORDER
                    </button>
                  </>
                )}

                {selectedOrder.status === 'confirmed' && (
                  <>
                    <button 
                      className="btn btn-ghost" 
                      style={{ flex: 1, color: 'var(--brand-red)' }}
                      onClick={() => { handleStatusUpdate(selectedOrder._id, 'cancelled'); setSelectedOrder(null); }}
                    >
                      CANCEL ORDER
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                      onClick={() => { handleStatusUpdate(selectedOrder._id, 'shipped'); setSelectedOrder(null); }}
                    >
                      SHIPPED
                    </button>
                  </>
                )}

                {selectedOrder.status === 'shipped' && (
                  <button 
                    className="btn btn-ghost" 
                    style={{ flex: 1, color: 'var(--brand-red)' }}
                    onClick={() => { handleStatusUpdate(selectedOrder._id, 'cancelled'); setSelectedOrder(null); }}
                  >
                    CANCEL & REVERT STOCK
                  </button>
                )}
              </div>
            )
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {!isEditing && (
              <div className={styles.detailSection}>
                <div className={styles.sectionLabel}>Customer & Shipping</div>
                <div className={styles.shippingGrid}>
                  <div className={styles.customerCard}>
                    <div className={styles.avatarPlaceholder}>{selectedOrder.customerInfo.name[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>{selectedOrder.customerInfo.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedOrder.customerInfo.email}</div>
                    </div>
                  </div>
                  <div className={styles.addressBlock}>
                    <div className={styles.infoLabel}>Delivery Address</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{selectedOrder.customerInfo.address}</p>
                    <div style={{ marginTop: '0.75rem', fontWeight: 600, color: 'var(--brand-red)', fontSize: '0.85rem' }}>
                      📞 {selectedOrder.customerInfo.phone}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.detailSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className={styles.sectionLabel}>Manifest ({selectedOrder.items.length} items)</div>
                {!isEditing && selectedOrder.status === 'pending' && (
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => { setEditItems([...selectedOrder.items]); setIsEditing(true); }}
                    style={{ fontSize: '0.7rem' }}
                  >
                    ✏️ EDIT ITEMS
                  </button>
                )}
              </div>
              <div className={styles.itemList}>
                {selectedOrder.items.map((item, idx) => {
                  const productInfo = productStocks[item.productId];
                  const currentSizeStock = productInfo?.sizes?.find((s: any) => s.size === item.size)?.stock ?? productInfo?.stock;
                  
                  return (
                    <div key={idx} className={styles.orderItemRow} style={{ alignItems: 'flex-start' }}>
                      <div className={styles.itemMain}>
                        <div className={styles.itemQty}>x{item.quantity}</div>
                        <div style={{ flex: 1 }}>
                          <div className={styles.itemName}>
                            {item.name}
                            {(!isEditing && item.size) && <span style={{ marginLeft: '8px', color: 'var(--brand-red)', fontSize: '0.8rem', fontWeight: 800 }}>({item.size})</span>}
                          </div>
                          
                          {isEditing ? (
                            <div style={{ marginTop: '0.75rem' }}>
                              <label className="form-label" style={{ fontSize: '0.65rem' }}>ADJUST SIZE</label>
                              <select 
                                className="form-input" 
                                value={editItems[idx]?.size || ''} 
                                onChange={e => {
                                  const newItems = [...editItems];
                                  newItems[idx] = { ...newItems[idx], size: e.target.value };
                                  setEditItems(newItems);
                                }}
                                style={{ minHeight: '38px', fontSize: '0.85rem', fontFamily: 'Rajdhani', fontWeight: 700 }}
                              >
                                {productInfo?.sizes?.map((s: any) => (
                                  <option key={s.size} value={s.size}>
                                    {s.size} ({s.stock} left)
                                  </option>
                                ))}
                                {!productInfo?.sizes?.length && <option value="">No sizes available</option>}
                              </select>
                            </div>
                          ) : (
                            productInfo && (
                              <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                <span style={{ color: currentSizeStock < item.quantity ? 'var(--brand-red)' : '#4eff91', fontWeight: 700 }}>
                                  STOCK LEFT: {currentSizeStock}
                                </span>
                                {productInfo.sizes && productInfo.sizes.length > 0 && (
                                  <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                    (
                                    {productInfo.sizes.map((s: any) => (
                                      <span key={s.size} style={{ color: s.size === item.size ? 'white' : 'inherit', fontWeight: s.size === item.size ? 800 : 400 }}>
                                        {s.size}: {s.stock}
                                      </span>
                                    ))}
                                    )
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      <div className={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)} MAD</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedOrder.referralCode && (
              <div className={styles.detailSection}>
                <div className={styles.sectionLabel}>Promo Code Applied</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: 'rgba(0,255,100,0.06)', border: '1px solid rgba(0,255,100,0.2)',
                  borderRadius: '12px', padding: '1rem 1.25rem', marginTop: '0.75rem',
                }}>
                  <div style={{ fontSize: '1.5rem' }}>🏷️</div>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.15em', color: '#4eff91' }}>
                      {selectedOrder.referralCode}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {selectedOrder.discountApplied}% discount applied to this order
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.summarySection}>
              <div className={styles.statusGroup}>
                <div className={styles.infoLabel}>Logistics Status</div>
                <span className={`${styles.statusBadge} ${styles[selectedOrder.status]}`}>{selectedOrder.status}</span>
              </div>
              <div className={styles.totalGroup}>
                <div className={styles.infoLabel}>Total Valuation</div>
                <div className={styles.grandTotal}>{selectedOrder.total.toFixed(2)} MAD</div>
                {selectedOrder.discountApplied && (
                  <div style={{ fontSize: '0.75rem', color: '#4eff91', fontWeight: 700, marginTop: '0.25rem' }}>
                    After {selectedOrder.discountApplied}% discount
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
