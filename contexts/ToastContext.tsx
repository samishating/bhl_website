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
              background: 'rgba(26, 26, 26, 0.95)',
              border: `2px solid ${
                t.type === 'success' ? '#22c55e' :
                t.type === 'error' ? '#ff0000' :
                t.type === 'warning' ? '#FFFDBA' :
                '#ffffff33'
              }`,
              borderRadius: '14px',
              padding: '1rem 2rem',
              fontSize: '0.95rem',
              color: 'white',
              boxShadow: `0 10px 40px rgba(0, 0, 0, 0.6), ${
                t.type === 'success' ? '0 0 20px rgba(34, 197, 94, 0.4)' :
                t.type === 'error' ? '0 0 20px rgba(255, 0, 0, 0.4)' :
                t.type === 'warning' ? '0 0 20px rgba(255, 253, 186, 0.4)' :
                '0 0 15px rgba(255, 255, 255, 0.15)'
              }`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              minWidth: '350px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>
              {t.type === 'success' ? '🛡️' :
               t.type === 'error' ? '🚫' :
               t.type === 'warning' ? '⚠️' : '🔔'}
            </span>
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.message}</span>
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
