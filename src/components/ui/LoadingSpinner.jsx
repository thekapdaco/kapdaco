import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ANIMATION_DURATIONS } from '../../lib/animationConstants';

/**
 * Loading spinner component with consistent styling
 */
const LoadingSpinner = ({ 
  size = 24, 
  className = '',
  variant = 'default', // 'default', 'primary', 'secondary'
  text,
  fullScreen = false,
  ...props 
}) => {
  const variantClasses = {
    default: 'text-[var(--kc-cream-100)]',
    primary: 'text-[var(--kc-gold-200)]',
    secondary: 'text-[var(--kc-beige-300)]',
  };

  const spinner = (
    <motion.div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIMATION_DURATIONS.sm }}
      {...props}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Loader2 
          size={size} 
          className={variantClasses[variant]}
          strokeWidth={2}
        />
      </motion.div>
      {text && (
        <p className="text-sm text-[var(--kc-cream-100)]/70 font-medium">
          {text}
        </p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--kc-navy-900)]/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Inline loading spinner for buttons
 */
export const InlineSpinner = ({ size = 16, className = '' }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{
      duration: 0.8,
      repeat: Infinity,
      ease: 'linear',
    }}
    className={className}
  >
    <Loader2 size={size} className="text-current" strokeWidth={2} />
  </motion.div>
);

/**
 * Button loading state wrapper
 */
export const ButtonLoading = ({ children, loading, ...props }) => {
  if (!loading) return children;
  
  return (
    <div className="relative inline-flex items-center justify-center" {...props}>
      <div className="opacity-0">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <InlineSpinner />
      </div>
    </div>
  );
};

export default LoadingSpinner;

