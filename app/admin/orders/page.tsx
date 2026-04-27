'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '../layout';
import styles from '../page.module.css';

interface Order {
  _id: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  customerInfo: { name: string; email: string; address: string };
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'var(--neon-blue)';
      case 'shipped': return 'var(--neon-green)';
      case 'delivered': return 'var(--neon-green)';
      case 'cancelled': return 'var(--brand-red)';
      default: return 'var(--text-muted)';
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setGlobalLoading(true);
    // Optimistic update
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        // Rollback on error
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
    <div className="container">
      <div className={styles.header}>
        <h1 className={styles.title}>Customer Orders</h1>
        <p className={styles.sub}>{orders.filter(o => o.status === 'pending').length} pending orders</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px' }}>
          No orders found.
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {o._id.slice(-8).toUpperCase()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.customerInfo.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customerInfo.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {o.items.length} items
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--neon-blue)' }}>${o.total.toFixed(2)}</span>
                  </td>
                  <td>
                    <div style={{ 
                      color: getStatusColor(o.status),
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '1px'
                    }}>
                      {o.status}
                    </div>
                    {o.processedBy && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        by {o.processedBy.username}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedOrder(o)}
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        Details
                      </button>
                      {o.status === 'pending' && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusUpdate(o._id, 'shipped')}
                        >
                          Process
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem'
        }} onClick={() => setSelectedOrder(null)}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3>Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>Shipping / Billing Address</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{selectedOrder.customerInfo.name}</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {selectedOrder.customerInfo.address}
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--neon-blue)', fontSize: '0.9rem' }}>{selectedOrder.customerInfo.email}</div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '1px' }}>Order Items</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                <span style={{ color: getStatusColor(selectedOrder.status), fontWeight: 700, textTransform: 'uppercase' }}>{selectedOrder.status}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neon-blue)' }}>Total: ${selectedOrder.total.toFixed(2)}</div>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              {selectedOrder.status === 'pending' && (
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    handleStatusUpdate(selectedOrder._id, 'shipped');
                    setSelectedOrder(null);
                  }}
                >
                  Process & Ship
                </button>
              )}
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
