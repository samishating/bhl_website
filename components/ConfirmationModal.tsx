'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as any } },
  exit:   { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as any } },
};

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1,   transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as any } },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' as any } },
};

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}: ConfirmationModalProps) {
  const { shouldReduce } = useMotionConfig();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={shouldReduce ? { duration: 0 } : undefined}
          onClick={onCancel}
        >
          <motion.div
            className={styles.modal}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={shouldReduce ? { duration: 0 } : undefined}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button className={`btn-close ${styles.closeBtn}`} onClick={onCancel} aria-label="Close">
              ✕
            </button>

            <div className={styles.icon}>
              {variant === 'danger'  && '⚠️'}
              {variant === 'warning' && '⚡'}
              {variant === 'info'    && 'ℹ️'}
            </div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
              <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onCancel}>
                {cancelLabel}
              </button>
              <button
                className={`${styles.btn} ${variant === 'danger' ? styles.btnDanger : styles.btnPrimary}`}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
