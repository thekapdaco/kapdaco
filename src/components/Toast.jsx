import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../lib/animationConstants';

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Toast Notification Component
 * Replaces basic alerts with premium toast notifications
 */
export const Toast = ({ id, message, type = 'info', duration = 5000, onClose }) => {
  const Icon = toastIcons[type] || toastIcons.info;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const typeStyles = {
    success: {
      bg: 'rgba(46, 125, 50, 0.15)',
      border: 'rgba(46, 125, 50, 0.4)',
      icon: '#2E7D32',
      text: 'var(--kc-cream-100)',
    },
    error: {
      bg: 'rgba(183, 28, 28, 0.15)',
      border: 'rgba(183, 28, 28, 0.4)',
      icon: '#B71C1C',
      text: 'var(--kc-cream-100)',
    },
    warning: {
      bg: 'rgba(255, 183, 77, 0.15)',
      border: 'rgba(255, 183, 77, 0.4)',
      icon: '#FFB74D',
      text: 'var(--kc-cream-100)',
    },
    info: {
      bg: 'rgba(211, 167, 95, 0.15)',
      border: 'rgba(211, 167, 95, 0.4)',
      icon: 'var(--kc-gold-200)',
      text: 'var(--kc-cream-100)',
    },
  };

  const styles = typeStyles[type] || typeStyles.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE }}
      className="toast-item"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: 'var(--kc-radius-lg)',
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        minWidth: '280px',
        maxWidth: '400px',
      }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon 
        size={20} 
        style={{ color: styles.icon, flexShrink: 0 }} 
        aria-hidden="true"
      />
      <p 
        style={{ 
          color: styles.text, 
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.5,
          flex: 1,
        }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={() => onClose?.(id)}
        className="toast-close"
        aria-label="Close notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: styles.text,
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--kc-radius-sm)',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </motion.div>
  );
};

/**
 * Toast Container - Manages multiple toasts
 */
export const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div
      className="toast-container"
      style={{
        position: 'fixed',
        top: 'calc(var(--nav-height, 110px) + 16px)',
        right: '16px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{ pointerEvents: 'auto' }}
          >
            <Toast {...toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Toast Hook - Use in components
 * Uses React Context for global toast management
 */
let toastIdCounter = 0;

// Create Toast Context
const ToastContext = React.createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const value = useMemo(() => ({
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }), [toasts, showToast, removeToast, success, error, warning, info]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      toasts: [],
      showToast: () => {},
      removeToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return context;
};

