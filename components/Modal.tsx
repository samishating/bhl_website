import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn, fadeIn } from '@/lib/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  padding?: string;
}

export default function Modal({ isOpen, onClose, title, children, footer, maxWidth, padding }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay" 
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={fadeIn}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            className="modal-content" 
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={scaleIn}
            style={{ width: `min(${maxWidth || '680px'}, calc(100vw - 32px))`, maxWidth: 'none' }}
          >
            <div className="modal-header">
              <h3 style={{ 
                fontFamily: 'Rajdhani', 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                margin: 0,
                color: '#fff'
              }}>
                {title}
              </h3>
              <button className="btn-close" onClick={onClose}>✕</button>
            </div>
            
            <div className="modal-body" style={padding ? { padding } : undefined}>
              {children}
            </div>

            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
