'use client';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface Order {
  _id: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  customerInfo: { name: string; email: string; address: string };
  status: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="container">
      <div className={styles.header}>
        <h1 className={styles.title}>Customer Orders</h1>
        <p className={styles.sub}>{orders.length} total orders</p>
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
                      {o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--neon-blue)' }}>${o.total.toFixed(2)}</span>
                  </td>
                  <td>
                    <span style={{ 
                      color: getStatusColor(o.status),
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '1px'
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
