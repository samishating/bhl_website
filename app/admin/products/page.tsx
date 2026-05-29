'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/Modal';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';


interface Product { _id: string; name: string; description: string; price: number; category: string; image: string; images: string[]; stock: number; sizes: { size: string, stock: number }[]; isLimitedDrop: boolean; }
const defaultForm = { name: '', description: '', price: 0, image: '', images: [] as string[], stock: 100, sizes: [] as { size: string, stock: number }[], isLimitedDrop: false, category: 'apparel' };

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
  const [pendingMain, setPendingMain] = useState<Blob | null>(null);
  const [pendingSecondary, setPendingSecondary] = useState<{ blob: Blob, id: string }[]>([]);
  const [previews, setPreviews] = useState<{ main: string, secondary: string[] }>({ main: '', secondary: [] });
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const load = () => { 
    setLoading(true);
    fetch('/api/products', { cache: 'no-store' })
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

  // Cleanup Blob URLs
  const cleanupPreviews = () => {
    if (previews.main.startsWith('blob:')) URL.revokeObjectURL(previews.main);
    previews.secondary.forEach(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    setPreviews({ main: '', secondary: [] });
    setPendingMain(null);
    setPendingSecondary([]);
  };

  const uploadToApi = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image && !pendingMain) return showToast('Please upload a main image', 'error');
    
    setCreating(true);
    try {
      let finalForm = { ...form };

      // Upload main image if pending
      if (pendingMain) {
        const url = await uploadToApi(pendingMain);
        finalForm.image = url;
      }

      // Upload secondary images if pending
      if (pendingSecondary.length > 0) {
        const uploadedUrls = await Promise.all(pendingSecondary.map(p => uploadToApi(p.blob)));
        // Filter out blob URLs and replace with real ones
        const existingImages = finalForm.images.filter(img => !img.startsWith('blob:'));
        finalForm.images = [...existingImages, ...uploadedUrls];
      }

      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalForm) });
      
      if (res.ok) { 
        cleanupPreviews();
        setForm(defaultForm); 
        setShowForm(false); 
        setEditingId(null);
        load(); 
        showToast(editingId ? 'Product updated!' : 'New product created!', 'success'); 
      }
      else { 
        const d = await res.json(); 
        showToast(`${d.error || 'Sync failed'}`, 'error'); 
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p._id);
    setForm({ ...p });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    load(); showToast('Product deleted', 'info');
  };

  return (
    <>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Product Management</h1>
            <p className={styles.sub}>Manage and configure platform products</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input 
                className="form-input" 
                placeholder="Search products..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '240px', minHeight: '42px' }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => { setForm(defaultForm); setEditingId(null); setShowForm(true); }}>
              + Create Product
            </button>
          </div>
        </div>

        <motion.div 
          className={styles.statsRow}
          variants={staggerContainer}
        >
          <motion.div className={styles.statCard} variants={fadeUp}>
            <div className={styles.statLabel}>Total Products</div>
            <div className={styles.statValue}><span>#</span>{stats.total}</div>
          </motion.div>
          <motion.div className={styles.statCard} variants={fadeUp}>
            <div className={styles.statLabel}>Exclusive Drops</div>
            <div className={styles.statValue}>
              <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '20px', height: '20px', marginRight: '0.5rem' }} />
              {stats.conqueror}
            </div>
          </motion.div>
          <motion.div className={styles.statCard} variants={fadeUp}>
            <div className={styles.statLabel}>Low Stock Alert</div>
            <div className={styles.statValue} style={{ color: stats.lowStock > 0 ? 'var(--brand-red)' : 'white' }}>
              <span>⚠️</span>{stats.lowStock}
            </div>
          </motion.div>
          <motion.div className={styles.statCard} variants={fadeUp}>
            <div className={styles.statLabel}>Inventory Value</div>
            <div className={styles.statValue}><span>MAD</span>{stats.totalValue.toLocaleString()}</div>
          </motion.div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '10rem' }}>
            <div className="loader-visual" style={{ margin: '0 auto' }}>
              <div className="loader-arc" />
              <img src="/brand/logo.png" alt="" className="loader-logo" />
            </div>
            <p className="loader-text" style={{ marginTop: '2rem' }}>Scanning Products...</p>
          </div>
        ) : (
          <motion.div 
            className={styles.productGrid}
            variants={staggerContainer}
          >
            {filteredProducts.map(p => (
              <motion.div 
                key={p._id} 
                className={styles.productCard}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className={styles.imageWrapper}>
                  <img src={p.image} alt={p.name} />
                  {p.isLimitedDrop && (
                    <div className={`${styles.cardBadge} ${styles.conquerorBadge}`}>
                      <img src="/ICONS/trophy_1.svg" alt="" style={{ width: '14px', height: '14px', marginRight: '0.4rem' }} />
                      Premium
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
                    <div className={styles.cardPrice}>{p.price.toFixed(2)} MAD</div>
                    <div className={styles.cardActions}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)} title="Edit Config">⚙️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)} title="Purge Asset">🗑️</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No products found</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); cleanupPreviews(); }}
        title={editingId ? 'Edit Product' : 'Create New Product'}
        maxWidth="800px"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); cleanupPreviews(); }} style={{ minWidth: '120px' }}>CANCEL</button>
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={creating} style={{ minWidth: '180px' }}>
              {creating ? <span className="spinner" /> : editingId ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className={styles.splitForm}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input required className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Premium Hoodie v1" />
                  </div>

                  <div className={styles.formRow}>
                    <div className="form-group">
                      <label className="form-label">Price (MAD) *</label>
                      <input required type="number" step="0.01" className="form-input" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Stock Units</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={form.sizes ? form.sizes.reduce((acc, s) => acc + s.stock, 0) : 0} 
                        readOnly
                        disabled
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select required className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {['apparel', 'accessories', 'gear', 'digital'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea required className="form-input" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide detailed specs..." style={{ resize: 'none' }} />
                  </div>

                  {/* Sizes & Inventory Builder */}
                  <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Size Variants & Inventory</label>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setForm(p => ({ ...p, sizes: [...(p.sizes || []), { size: '', stock: 0 }] }))}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        + Add Size
                      </button>
                    </div>
                    
                    {(!form.sizes || form.sizes.length === 0) ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No sizes defined. Base stock will be used.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {form.sizes.map((s, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input 
                              required
                              placeholder="Size (e.g. S, M, L)"
                              className="form-input" 
                              style={{ flex: 1 }}
                              value={s.size} 
                              onChange={e => {
                                const newSizes = [...form.sizes];
                                newSizes[idx].size = e.target.value;
                                setForm(p => ({ ...p, sizes: newSizes }));
                              }} 
                            />
                            <input 
                              required
                              type="number"
                              min="0"
                              placeholder="Stock"
                              className="form-input" 
                              style={{ width: '100px' }}
                              value={s.stock} 
                              onChange={e => {
                                const newSizes = [...form.sizes];
                                newSizes[idx].stock = Number(e.target.value);
                                setForm(p => ({ ...p, sizes: newSizes }));
                              }} 
                            />
                            <button 
                              type="button"
                              className="btn btn-danger btn-sm" 
                              style={{ padding: '0.4rem 0.6rem' }}
                              onClick={() => {
                                setForm(p => ({ ...p, sizes: p.sizes.filter((_, i) => i !== idx) }));
                              }}
                            >✕</button>
                          </div>
                        ))}
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--brand-red)', fontWeight: 800 }}>
                          TOTAL VARIANT STOCK: {form.sizes.reduce((acc, curr) => acc + curr.stock, 0)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Premium Drop Toggle Block */}
                  <div 
                    className={styles.premiumToggle} 
                    onClick={() => setForm(p => ({ ...p, isLimitedDrop: !p.isLimitedDrop }))}
                    style={{ marginBottom: 0 }}
                  >
                    <div className={styles.toggleBox}>
                      {form.isLimitedDrop && <div className={styles.checkmark}>✓</div>}
                    </div>
                    <div className={styles.toggleContent}>
                      <div className={styles.toggleLabel}>PREMIUM DROP</div>
                      <div className={styles.toggleSubtext}>Requires 40k XP</div>
                    </div>
                  </div>
                </div>

                <div className={styles.previewSection}>
                  <label className="form-label">Images</label>
                  
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                    <img src={previews.main || form.image || 'https://placehold.co/600x600/111/white?text=No+Preview'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <label style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', width: '80%' }}>
                      <div className="btn btn-primary btn-sm" style={{ width: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        Change Main Image
                      </div>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const compressed = await compressImage(file);
                        const url = URL.createObjectURL(compressed);
                        if (previews.main.startsWith('blob:')) URL.revokeObjectURL(previews.main);
                        setPreviews(p => ({ ...p, main: url }));
                        setPendingMain(compressed);
                      }} />
                    </label>
                  </div>

                  <div className={styles.imageGrid}>
                    {/* Existing Images */}
                    {form.images.map((img, idx) => (
                      <div key={`exist-${idx}`} className={styles.imageThumb}>
                        <img src={img} alt="" />
                        <button type="button" className={styles.removeImg} onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}>✕</button>
                      </div>
                    ))}
                    {/* Pending Previews */}
                    {previews.secondary.map((url, idx) => (
                      <div key={`pend-${idx}`} className={styles.imageThumb}>
                        <img src={url} alt="" />
                        <button type="button" className={styles.removeImg} onClick={() => {
                          URL.revokeObjectURL(url);
                          setPreviews(p => ({ ...p, secondary: p.secondary.filter((_, i) => i !== idx) }));
                          setPendingSecondary(p => p.filter((_, i) => i !== idx));
                        }}>✕</button>
                      </div>
                    ))}

                    {(form.images.length + previews.secondary.length) < 4 && (
                      <label className={styles.uploadBox}>
                        <span style={{ fontSize: '1.5rem', color: 'var(--brand-red)' }}>+</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const compressed = await compressImage(file);
                          const url = URL.createObjectURL(compressed);
                          setPreviews(p => ({ ...p, secondary: [...p.secondary, url] }));
                          setPendingSecondary(p => [...p, { blob: compressed, id: url }]);
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              </form>
      </Modal>
    </>
  );
}
