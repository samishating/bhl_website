'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useToast } from '@/contexts/ToastContext';


interface Product { _id: string; name: string; description: string; price: number; category: string; image: string; images: string[]; stock: number; isLimitedDrop: boolean; }
const defaultForm = { name: '', description: '', price: 29.99, image: '', images: [] as string[], stock: 100, isLimitedDrop: false, category: 'apparel' };

/** Compress an image file client-side to max 800px and 75% JPEG quality before upload */
function compressImage(file: File, maxDim = 800, quality = 0.75): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compression failed')), 'image/jpeg', quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);
  const { showToast } = useToast();

  const load = () => { fetch('/api/products').then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); }); };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setCreating(false);
    if (res.ok) { 
      setForm(defaultForm); 
      setShowForm(false); 
      setEditingId(null);
      load(); 
      showToast(editingId ? 'Product updated!' : 'Product added!', 'success'); 
    }
    else { const d = await res.json(); showToast(`${d.error || 'Failed'}`, 'error'); }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p._id);
    setForm({ ...p });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    // No confirmation alert per user request, using toast for feedback
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    load(); showToast('Product deleted', 'info');
  };

  return (
    <div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.sub}>{products.length} products listed</p>
        </div>
        <button className="btn btn-primary" onClick={() => { if(showForm) {setForm(defaultForm); setEditingId(null);} setShowForm(!showForm); }} id="admin-add-product-btn">
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <div className={styles.splitLayout}>
          <form onSubmit={handleCreate} className={styles.createForm}>
            <h3 className={styles.formTitle}>{editingId ? 'Edit Product' : 'Add Product'}</h3>
            
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
                <label className="form-label">Featured Image URL</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="form-input" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://…" id="product-image" />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploading ? '⌛' : '📂'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const compressed = await compressImage(file);
                        const formData = new FormData();
                        formData.append('file', compressed, 'image.jpg');
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.url) {
                          setForm(p => ({ ...p, image: data.url }));
                          showToast('Image uploaded!', 'success');
                        } else {
                          showToast(`Upload failed: ${data.error}`, 'error');
                        }
                      } catch {
                        showToast('Upload error', 'error');
                      } finally {
                        setUploading(false);
                      }
                    }} />
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Secondary Images</label>
              <div className={styles.imageGrid}>
                {form.images.map((img, idx) => (
                  <div key={idx} className={styles.imageThumb}>
                    <img src={img} alt="" />
                    <button type="button" className={styles.removeImg} onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}>✕</button>
                  </div>
                ))}
                
                <label className={styles.uploadBox}>
                  <span>{uploadingSecondary ? '⌛' : '+'}</span>
                  <label>{uploadingSecondary ? 'Uploading' : 'Add Image'}</label>
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingSecondary} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingSecondary(true);
                    try {
                      const compressed = await compressImage(file);
                      const formData = new FormData();
                      formData.append('file', compressed, 'image.jpg');
                      const res = await fetch('/api/upload', { method: 'POST', body: formData });
                      const data = await res.json();
                      if (data.url) setForm(f => ({ ...f, images: [...f.images, data.url] }));
                      else showToast(`Upload failed: ${data.error}`, 'error');
                    } catch { showToast('Upload error', 'error'); }
                    finally { setUploadingSecondary(false); }
                  }} />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea required className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Product description…" id="product-desc" style={{ resize: 'vertical' }} />
            </div>

            <div className={styles.formRow}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.isLimitedDrop} onChange={e => setForm(p => ({ ...p, isLimitedDrop: e.target.checked }))} id="product-limited" />
                Conqueror Drop (40k XP) 🔥
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={creating} id="product-submit-btn" style={{ marginTop: '1rem' }}>
              {creating ? <span className="spinner" /> : editingId ? 'Update Product' : 'Add Product'}
            </button>
          </form>

          <div className={styles.previewSection}>
            <div className={styles.formTitle} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Live Preview</div>
            <div className={styles.previewCard}>
              <img src={form.image || 'https://placehold.co/600x600/111/white?text=No+Image'} alt="" className={styles.previewImage} />
              <div className={styles.previewInfo}>
                <div className={styles.previewPrice}>${form.price.toFixed(2)}</div>
                <div className={styles.previewName}>{form.name || 'Product Title'}</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {form.description || 'Description will appear here...'}
                </p>
                {form.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    {form.images.slice(0, 4).map((img, i) => (
                      <div key={i} style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                    {form.images.length > 4 && <div style={{ fontSize: '0.7rem', alignSelf: 'center', color: 'var(--text-muted)' }}>+{form.images.length - 4}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
                    {p.name} {p.isLimitedDrop && <span style={{ color: '#FF0000', fontSize: '0.75rem' }}>🔥 Conqueror</span>}
                  </td>
                  <td><span className="division-tag tag-all">{p.category}</span></td>
                  <td><span style={{ color: 'var(--neon-blue)', fontFamily: 'Rajdhani', fontWeight: 700 }}>${p.price.toFixed(2)}</span></td>
                  <td style={{ color: p.stock < 10 ? 'var(--neon-red)' : 'var(--text-secondary)' }}>{p.stock}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)} id={`edit-product-${p._id}`}>Edit</button>
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
