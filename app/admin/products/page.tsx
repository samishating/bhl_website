'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Product { _id: string; name: string; price: number; category: string; stock: number; isLimitedDrop: boolean; }
const defaultForm = { name: '', description: '', price: 29.99, image: '', stock: 100, isLimitedDrop: false, category: 'apparel' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const load = () => { fetch('/api/products').then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); }); };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setCreating(false);
    if (res.ok) { setForm(defaultForm); setShowForm(false); load(); showToast('✅ Product added!'); }
    else { const d = await res.json(); showToast(`❌ ${d.error || 'Failed'}`); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    load(); showToast('🗑 Product deleted');
  };

  return (
    <div>
      {toast && <div className="toast">{toast}</div>}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.sub}>{products.length} products listed</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} id="admin-add-product-btn">
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <h3 className={styles.formTitle}>Add Product</h3>
          <div className={styles.formRow}>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Name *</label>
              <input required className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Product name" id="product-name" />
            </div>
            <div className="form-group">
              <label className="form-label">Price ($)</label>
              <input type="number" step="0.01" className="form-input" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} id="product-price" />
            </div>
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input type="number" className="form-input" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} id="product-stock" />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} id="product-category">
                {['apparel', 'accessories', 'gear', 'digital'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Image URL</label>
              <input className="form-input" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://…" id="product-image" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea required className="form-input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Product description…" id="product-desc" style={{ resize: 'vertical' }} />
          </div>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={form.isLimitedDrop} onChange={e => setForm(p => ({ ...p, isLimitedDrop: e.target.checked }))} id="product-limited" />
            Limited Drop (🔥 badge)
          </label>
          <button type="submit" className="btn btn-primary" disabled={creating} id="product-submit-btn">
            {creating ? <span className="spinner" /> : 'Add Product'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600 }}>
                    {p.name} {p.isLimitedDrop && <span style={{ color: '#FF0000', fontSize: '0.75rem' }}>🔥 Limited</span>}
                  </td>
                  <td><span className="division-tag tag-all">{p.category}</span></td>
                  <td><span style={{ color: 'var(--neon-blue)', fontFamily: 'Rajdhani', fontWeight: 700 }}>${p.price.toFixed(2)}</span></td>
                  <td style={{ color: p.stock < 10 ? 'var(--neon-red)' : 'var(--text-secondary)' }}>{p.stock}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)} id={`delete-product-${p._id}`}>Delete</button>
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
