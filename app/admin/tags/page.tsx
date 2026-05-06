'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/animations';
import styles from './page.module.css';

interface Tag {
  _id: string;
  name: string;
  key: string;
  color: string;
  type: 'division' | 'role' | 'badge' | 'creator';
  description: string;
  requirements: string;
  createdAt: string;
}

export default function AdminTagsPage() {
  const { showToast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    key: '',
    color: '#FF0000',
    type: 'badge' as Tag['type'],
    description: '',
    requirements: ''
  });

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/admin/tags');
      const data = await res.json();
      setTags(data.tags || []);
    } catch (err) {
      showToast('Failed to fetch tags', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleOpenModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setForm({
        name: tag.name,
        key: tag.key,
        color: tag.color,
        type: tag.type,
        description: tag.description,
        requirements: tag.requirements
      });
    } else {
      setEditingTag(null);
      setForm({
        name: '',
        key: '',
        color: '#FF0000',
        type: 'badge',
        description: '',
        requirements: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = editingTag ? 'PATCH' : 'POST';
      const body = editingTag ? { id: editingTag._id, ...form } : form;
      
      const res = await fetch('/api/admin/tags', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        showToast(editingTag ? 'Tag updated' : 'Tag created', 'success');
        setIsModalOpen(false);
        fetchTags();
      } else {
        const data = await res.json();
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast('Tag deleted', 'info');
        fetchTags();
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  if (loading) return <div className={styles.loading}><span className="spinner" /></div>;

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeUp}
      className={styles.container}
    >
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tags & Badges</h1>
          <p className={styles.sub}>Manage user labels, creator roles, and division identifiers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Create New Tag
        </button>
      </header>

      <motion.div 
        className={styles.tagGrid}
        variants={staggerContainer}
      >
        {tags.map(tag => (
          <motion.div 
            key={tag._id} 
            className={`${styles.tagCard} premium-panel`}
            variants={fadeUp}
          >
            <div className={styles.tagTop}>
              <div className={styles.tagPreview} style={{ backgroundColor: `${tag.color}15`, borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </div>
              <span className={styles.tagType}>{tag.type}</span>
            </div>
            
            <div className={styles.tagInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Key ID:</span>
                <span className={styles.value}>{tag.key}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Conditions:</span>
                <span className={styles.value}>{tag.requirements || 'Manual Assignment'}</span>
              </div>
            </div>

            <p className={styles.description}>{tag.description || 'No description provided.'}</p>

            <div className={styles.actions}>
              <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(tag)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tag._id)}>Delete</button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingTag ? 'Edit Tag' : 'Create New Tag'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Tag Name</label>
            <input 
              className="form-input" 
              placeholder="e.g. Gaming Creator" 
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Key ID (Must be unique)</label>
            <input 
              className="form-input" 
              placeholder="e.g. gaming_creator" 
              value={form.key}
              onChange={e => setForm({ ...form, key: e.target.value })}
              required 
              disabled={!!editingTag}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select 
                className="form-input"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as any })}
              >
                <option value="badge">Badge</option>
                <option value="creator">Creator Role</option>
                <option value="division">Division</option>
                <option value="role">System Role</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Theme Color</label>
              <div className={styles.colorInputWrapper}>
                <input 
                  type="color" 
                  className={styles.colorInput}
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                />
                <input 
                  className="form-input" 
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Requirements / Conditions</label>
            <textarea 
              className="form-input" 
              placeholder="What are the conditions to get this tag?" 
              value={form.requirements}
              onChange={e => setForm({ ...form, requirements: e.target.value })}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              placeholder="Short description of what this tag represents..." 
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
