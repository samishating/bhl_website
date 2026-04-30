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
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '0.6rem',
        pointerEvents: 'none',
        alignItems: 'center',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              background: 'rgba(26, 26, 26, 0.85)',
              border: `1px solid ${
                t.type === 'success' ? 'rgba(34, 197, 94, 0.5)' :
                t.type === 'error' ? 'rgba(255, 0, 0, 0.5)' :
                t.type === 'warning' ? 'rgba(255, 253, 186, 0.5)' :
                'rgba(255, 255, 255, 0.15)'
              }`,
              borderRadius: '999px', // Pill shape for bottom-center
              padding: '0.65rem 1.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), var(--glow-red)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              minWidth: '280px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>
              {t.type === 'success' ? '🛡️' :
               t.type === 'error' ? '🚫' :
               t.type === 'warning' ? '⚠️' : '🔔'}
            </span>
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t.message}</span>
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
