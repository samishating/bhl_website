'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { calculateLevel, getLevelTitle, xpForNextLevel } from '@/lib/xp';
import Modal from '@/components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';
import styles from './page.module.css';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  xp: number;
  level: number;
  role: string;
  createdAt: string;
  divisions: string[];
}

interface ProgressionLevel {
  level: number;
  title: string;
  xpRequired: number;
}

export default function AdminXPPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'users' | 'system'>('system');
  const [users, setUsers] = useState<User[]>([]);
  const [progression, setProgression] = useState<ProgressionLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newXp, setNewXp] = useState<number>(0);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempData, setTempData] = useState<ProgressionLevel | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, progRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/progression')
      ]);
      const usersData = await usersRes.json();
      const progData = await progRes.json();
      
      setUsers(usersData.users || []);
      setProgression(progData.progression || []);
    } catch (err) {
      console.error('[AdminXP] Fetch error:', err);
      showToast('Critical synchronization failure', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditXp = (user: User) => {
    setEditingUser(user);
    setNewXp(user.xp);
  };

  const handleSaveXp = async () => {
    if (!editingUser) return;
    setIsSavingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser._id}/xp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: newXp })
      });

      if (res.ok) {
        showToast(`XP synchronized for ${editingUser.username}`, 'success');
        setEditingUser(null);
        const updatedUsers = await fetch('/api/users').then(r => r.json());
        setUsers(updatedUsers.users || []);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update XP', 'error');
      }
    } catch (err) {
      showToast('Network error during synchronization', 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleAddLevel = () => {
    const nextLevel = progression.length + 1;
    const lastXp = progression.length > 0 ? progression[progression.length - 1].xpRequired : 0;
    const newLevel = { 
      level: nextLevel, 
      title: `Rank ${nextLevel}`, 
      xpRequired: lastXp + 500 
    };
    setProgression([...progression, newLevel]);
    setEditingIndex(progression.length);
    setTempData(newLevel);
  };

  const handleRemoveLevel = (index: number) => {
    if (progression.length <= 1) return;
    const updated = progression.filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, level: i + 1 }));
    setProgression(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setTempData(null);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setTempData({ ...progression[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setTempData(null);
  };

  const saveRow = (index: number) => {
    if (!tempData) return;
    const updated = [...progression];
    updated[index] = tempData;
    setProgression(updated);
    setEditingIndex(null);
    setTempData(null);
  };

  const handleSaveSystem = async () => {
    setIsSavingSystem(true);
    try {
      const res = await fetch('/api/admin/progression', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progression })
      });

      if (res.ok) {
        showToast('Progression system updated globally', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update progression', 'error');
      }
    } catch (err) {
      showToast('Network error during save', 'error');
    } finally {
      setIsSavingSystem(false);
    }
  };

  const currentThresholds = progression.map(p => p.xpRequired);
  const currentTitles = progression.map(p => p.title);
  const previewLevel = calculateLevel(newXp, currentThresholds);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem' }}>
        <div className="loader-visual" style={{ margin: '0 auto' }}>
          <div className="loader-arc" />
          <img src="/brand/logo.webp" alt="" className="loader-logo" />
        </div>
        <p className="loader-text" style={{ marginTop: '2rem' }}>Decrypting progression nodes...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Progression Sector</h1>
          <p className={styles.sub}>Manage global level architecture and member experience</p>
        </div>
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'system' ? styles.active : ''}`}
            onClick={() => setActiveTab('system')}
          >
            Level System
            {activeTab === 'system' && (
              <motion.div 
                layoutId="adminXpTab"
                className={styles.tabHighlight}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Personnel XP
            {activeTab === 'users' && (
              <motion.div 
                layoutId="adminXpTab"
                className={styles.tabHighlight}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'system' ? (
        <div className={styles.systemView}>
          <div className={styles.systemHeader}>
            <div>
              <h3>Global Rank Architecture</h3>
              <p>Define levels, titles, and XP thresholds for the entire platform.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={handleAddLevel}>+ Add Rank</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveSystem} disabled={isSavingSystem}>
                {isSavingSystem ? 'Saving...' : 'Deploy System'}
              </button>
            </div>
          </div>

          <div className={styles.levelTable}>
            <div className={styles.levelTableHeader}>
              <div className={styles.colLvl}>LVL</div>
              <div className={styles.colTitle}>RANK TITLE</div>
              <div className={styles.colXp}>XP REQUIRED</div>
              <div className={styles.colActions}>ACTIONS</div>
            </div>
            {progression.map((p, i) => (
              <div key={i} className={`${styles.levelTableRow} ${editingIndex === i ? styles.isEditing : ''}`}>
                <div className={styles.colLvl}>
                  <span className={styles.lvlAnchor}>{p.level}</span>
                  {i < progression.length - 1 && <div className={styles.ladderLine} />}
                </div>
                
                <div className={styles.colTitle}>
                  {editingIndex === i ? (
                    <input 
                      className={styles.inlineInput} 
                      value={tempData?.title || ''} 
                      onChange={e => setTempData(prev => prev ? { ...prev, title: e.target.value } : null)}
                      autoFocus
                    />
                  ) : (
                    <span className={styles.rankTitleText}>{p.title}</span>
                  )}
                </div>

                <div className={styles.colXp}>
                  {editingIndex === i ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="number"
                        className={styles.inlineInput} 
                        value={tempData?.xpRequired || 0} 
                        onChange={e => setTempData(prev => prev ? { ...prev, xpRequired: Number(e.target.value) } : null)}
                      />
                      <span className={styles.xpSmallUnit}>XP</span>
                    </div>
                  ) : (
                    <div className={styles.xpDisplay}>
                      <span className={styles.xpText}>{p.xpRequired.toLocaleString()}</span>
                      <span className={styles.xpSmallUnit}>XP</span>
                    </div>
                  )}
                </div>

                <div className={styles.colActions}>
                  <div className={styles.actionReveal}>
                    {editingIndex === i ? (
                      <>
                        <button className={styles.iconBtn} onClick={() => saveRow(i)} title="Save Rank">✓</button>
                        <button className={styles.iconBtn} onClick={cancelEditing} title="Cancel">✕</button>
                      </>
                    ) : (
                      <>
                        <button className={styles.iconBtn} onClick={() => startEditing(i)} title="Edit Rank">✎</button>
                        <button className={`${styles.iconBtn} ${styles.btnDestructive}`} onClick={() => handleRemoveLevel(i)} title="Delete Rank">🗑</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <input
              className="form-input"
              style={{ width: '400px' }}
              placeholder="Search personnel by intel..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <motion.div 
            className={styles.userGrid}
            variants={staggerContainer}
          >
            {filteredUsers.map(u => {
              const xpData = xpForNextLevel(u.xp, currentThresholds);
              return (
                <motion.div 
                  key={u._id} 
                  className={styles.userCard}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.avatarContainer}>
                      <div className={styles.avatar}>
                        {u.avatar ? <img src={u.avatar} alt={u.username} /> : u.username[0].toUpperCase()}
                      </div>
                    </div>
                    
                    <div className={styles.mainInfo}>
                      <div className={styles.nameLine}>
                        <span className={styles.username}>{u.username}</span>
                        <span className={`${styles.roleDot} ${styles[u.role] || styles.user}`} title={u.role} />
                        {u.email && <span className={styles.emailHint} title={u.email}>@</span>}
                      </div>
                      <div className={styles.rankLine}>
                        <span className={styles.rankTitle}>{getLevelTitle(u.level, currentTitles)}</span>
                        <span className={styles.lvlLabel}>LVL {u.level}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.progressSection}>
                    <div className={styles.xpMeta}>
                      <span className={styles.xpCount}>
                        <strong>{u.xp.toLocaleString()}</strong> / {xpData.needed > 0 ? (u.xp + (xpData.needed - xpData.current)).toLocaleString() : 'MAX'} XP
                      </span>
                      <span className={styles.xpPercent}>{xpData.progress}%</span>
                    </div>
                    <div className={styles.miniXpBar}>
                      <div className={styles.miniXpFill} style={{ width: `${xpData.progress}%` }} />
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <button 
                      className={styles.secondaryAction}
                      onClick={() => handleEditXp(u)}
                      disabled={currentUser?.role !== 'superadmin'}
                    >
                      Override XP
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      <Modal
        isOpen={!!editingUser}
        onClose={() => !isSavingUser && setEditingUser(null)}
        title={`Adjust XP: ${editingUser?.username}`}
        maxWidth="420px"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEditingUser(null)} disabled={isSavingUser} style={{ flex: 1 }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveXp} disabled={isSavingUser} style={{ flex: 1 }}>
              {isSavingUser ? 'Syncing...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className={styles.modalXpInfo}>
          <div>
            <div className={styles.previewLabel}>Current XP</div>
            <div className={styles.previewValue}>{editingUser?.xp.toLocaleString()} dh</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.previewLabel}>Preview Level</div>
            <div className={`${styles.previewValue} ${newXp !== editingUser?.xp ? styles.new : ''}`}>
              Lv.{previewLevel}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Target XP Value</label>
          <input 
            type="number"
            className="form-input" 
            value={newXp} 
            onChange={e => setNewXp(Number(e.target.value))}
            disabled={isSavingUser}
            min="0"
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Rank: {getLevelTitle(previewLevel, currentTitles)}
          </p>
        </div>
      </Modal>
    </motion.div>
  );
}
