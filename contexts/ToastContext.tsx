'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  return (
    <ToastContext.Provider value={{ showToast, clearToasts }}>
      {children}
      {/* Toast Widget */}
      <div style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${
                t.type === 'success' ? 'var(--neon-green)' :
                t.type === 'error' ? 'var(--brand-red)' :
                t.type === 'warning' ? '#FFFDBA' :
                'rgba(255,255,255,0.15)'
              }`,
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.25rem',
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              boxShadow: t.type === 'success'
                ? '0 0 20px rgba(34,197,94,0.25)'
                : t.type === 'error'
                ? 'var(--glow-red)'
                : '0 4px 24px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
              animation: 'fadeInUp 0.3s ease forwards',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              minWidth: '220px',
              maxWidth: '380px',
            }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
              {t.type === 'success' ? '✅' :
               t.type === 'error' ? '❌' :
               t.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
