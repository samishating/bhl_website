'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '../layout';
import styles from './page.module.css';

interface Order {
  _id: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  customerInfo: { name: string; email: string; address: string; phone: string };
  status: string;
  processedBy?: { username: string };
  processedAt?: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { refreshCounts, setGlobalLoading } = useAdmin();

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => {
        setOrders(d.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setGlobalLoading(true);
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const r = await fetch('/api/orders');
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

  return (
    <>
      <div className="animate-fade-up">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Order Management</h1>
            <p className={styles.sub}>{orders.filter(o => o.status === 'pending').length} orders pending processing</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '10rem' }}>
            <div className="loader-visual" style={{ margin: '0 auto' }}>
              <div className="loader-arc" />
              <img src="/brand/logo.webp" alt="" className="loader-logo" />
            </div>
            <p className="loader-text" style={{ marginTop: '2rem' }}>Loading Orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No logistics data found</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {o._id.slice(-8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'white' }}>{o.customerInfo.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customerInfo.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {o.items.length} Units
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--neon-blue)', fontFamily: 'Rajdhani', fontSize: '1.1rem' }}>
                        ${o.total.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[o.status]}`}>
                        {o.status}
                      </span>
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
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(o._id, 'shipped')}>SHIP</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '700px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className={styles.modalTitle}>Order Details</h3>
                <p className={styles.modalSub}>#{selectedOrder._id.slice(-8).toUpperCase()} • {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <div className="modal-body" style={{ gap: '2.5rem' }}>
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

              <div className={styles.detailSection}>
                <br />
                <div className={styles.sectionLabel}>Manifest ({selectedOrder.items.length} items)</div>
                <div className={styles.itemList}>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className={styles.orderItemRow}>
                      <div className={styles.itemMain}>
                        <div className={styles.itemQty}>x{item.quantity}</div>
                        <div className={styles.itemName}>{item.name}</div>
                      </div>
                      <div className={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.summarySection}>
                <div className={styles.statusGroup}>
                  <div className={styles.infoLabel}>Logistics Status</div>
                  <span className={`${styles.statusBadge} ${styles[selectedOrder.status]}`}>{selectedOrder.status}</span>
                </div>
                <div className={styles.totalGroup}>
                   <div className={styles.infoLabel}>Total Valuation</div>
                   <div className={styles.grandTotal}>${selectedOrder.total.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedOrder(null)}>CLOSE</button>
              {selectedOrder.status === 'pending' && (
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    handleStatusUpdate(selectedOrder._id, 'shipped');
                    setSelectedOrder(null);
                  }}
                >
                  MARK AS SHIPPED
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
