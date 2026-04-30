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
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const load = () => { 
    setLoading(true);
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { 
        setProducts(d.products || []); 
        setLoading(false); 
      }); 
  };
  useEffect(load, []);

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock < 10).length,
    conqueror: products.filter(p => p.isLimitedDrop).length,
    totalValue: products.reduce((acc, p) => acc + (p.price * p.stock), 0)
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) return showToast('Please upload a main image', 'error');
    
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
      showToast(editingId ? 'Product synchronized!' : 'New product deployed!', 'success'); 
    }
    else { const d = await res.json(); showToast(`${d.error || 'Sync failed'}`, 'error'); }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p._id);
    setForm({ ...p });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    load(); showToast('Product purged from database', 'info');
  };

  return (
    <div className="animate-fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Armory Management</h1>
          <p className={styles.sub}>Configure and deploy brotherhood merchandise</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input 
              className="form-input" 
              placeholder="Search assets..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '240px', minHeight: '42px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(defaultForm); setEditingId(null); setShowForm(true); }}>
            + Deploy New Asset
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Assets</div>
          <div className={styles.statValue}><span>#</span>{stats.total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Conqueror Drops</div>
          <div className={styles.statValue}>
            <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '20px', height: '20px', marginRight: '0.5rem' }} />
            {stats.conqueror}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Low Stock Alert</div>
          <div className={styles.statValue} style={{ color: stats.lowStock > 0 ? 'var(--brand-red)' : 'white' }}>
            <span>⚠️</span>{stats.lowStock}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Inventory Value</div>
          <div className={styles.statValue}><span>$</span>{stats.totalValue.toLocaleString()}</div>
        </div>
      </div>

      {showForm && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.title} style={{ fontSize: '1.2rem', marginBottom: 0 }}>
                {editingId ? 'Edit Configuration' : 'Deploy New Asset'}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              <form onSubmit={handleCreate} className={styles.splitForm}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Asset Name *</label>
                    <input required className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Conqueror Hoodie v1" />
                  </div>

                  <div className={styles.formRow}>
                    <div className="form-group">
                      <label className="form-label">Price ($)</label>
                      <input type="number" step="0.01" className="form-input" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stock Units</label>
                      <input type="number" className="form-input" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                        {['apparel', 'accessories', 'gear', 'digital'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Intel / Description *</label>
                    <textarea required className="form-input" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide detailed specs..." style={{ resize: 'none' }} />
                  </div>

                  <div className="form-group">
                    <label className={styles.checkLabel}>
                      <input type="checkbox" checked={form.isLimitedDrop} onChange={e => setForm(p => ({ ...p, isLimitedDrop: e.target.checked }))} />
                      Conqueror Class Asset (Requires 40k XP) <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '14px', height: '14px', marginLeft: '0.4rem', verticalAlign: 'middle' }} />
                    </label>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={creating} style={{ flex: 1 }}>
                      {creating ? <span className="spinner" /> : editingId ? 'Update Asset' : 'Deploy Asset'}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </div>

                <div className={styles.previewSection}>
                  <label className="form-label">Visual Assets</label>
                  
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                    <img src={form.image || 'https://placehold.co/600x600/111/white?text=No+Preview'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <label style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', width: '80%' }}>
                      <div className="btn btn-primary btn-sm" style={{ width: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {uploading ? '⌛ Uploading...' : 'Change Main Image'}
                      </div>
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
                          if (data.url) setForm(p => ({ ...p, image: data.url }));
                        } finally { setUploading(false); }
                      }} />
                    </label>
                  </div>

                  <div className={styles.imageGrid}>
                    {form.images.map((img, idx) => (
                      <div key={idx} className={styles.imageThumb}>
                        <img src={img} alt="" />
                        <button type="button" className={styles.removeImg} onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}>✕</button>
                      </div>
                    ))}
                    {form.images.length < 4 && (
                      <label className={styles.uploadBox}>
                        <span style={{ fontSize: '1.5rem', color: 'var(--brand-red)' }}>+</span>
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
                          } finally { setUploadingSecondary(false); }
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '10rem' }}>
          <div className="loader-visual" style={{ margin: '0 auto' }}>
            <div className="loader-arc" />
            <img src="/brand/logo.webp" alt="" className="loader-logo" />
          </div>
          <p className="loader-text" style={{ marginTop: '2rem' }}>Scanning Inventory...</p>
        </div>
      ) : (
        <div className={styles.productGrid}>
          {filteredProducts.map(p => (
            <div key={p._id} className={styles.productCard}>
              <div className={styles.imageWrapper}>
                <img src={p.image} alt={p.name} />
                {p.isLimitedDrop && (
                  <div className={`${styles.cardBadge} ${styles.conquerorBadge}`}>
                    <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '14px', height: '14px', marginRight: '0.4rem' }} />
                    Conqueror
                  </div>
                )}
                <div className={styles.cardBadge} style={{ top: 'auto', bottom: '1rem' }}>
                  {p.category}
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.cardName}>{p.name}</div>
                <div className={`${styles.cardStock} ${p.stock < 10 ? styles.lowStock : ''}`}>
                  <span className="status-dot" style={{ background: p.stock < 10 ? 'var(--brand-red)' : '#22c55e' }} />
                  {p.stock} units in reserve
                </div>
                
                <div className={styles.cardFooter}>
                  <div className={styles.cardPrice}>${p.price.toFixed(2)}</div>
                  <div className={styles.cardActions}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)} title="Edit Config">⚙️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)} title="Purge Asset">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No assets found in current sector</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
