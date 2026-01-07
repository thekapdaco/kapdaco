import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const AuthShell = ({
  eyebrow,
  title,
  subtitle,
  icon,
  children,
  footer,
  className,
  role = 'customer', // 'customer', 'designer', 'admin'
  leftPanelContent,
}) => {
  // Role-specific configurations
  const roleConfig = {
    customer: {
      gradient: 'linear-gradient(135deg, rgba(211, 167, 95, 0.15) 0%, rgba(159, 120, 96, 0.1) 100%)',
      accent: 'var(--kc-gold-200)',
      iconBg: 'rgba(211, 167, 95, 0.2)',
    },
    designer: {
      gradient: 'linear-gradient(135deg, rgba(211, 167, 95, 0.2) 0%, rgba(159, 120, 96, 0.15) 100%)',
      accent: 'var(--kc-gold-200)',
      iconBg: 'rgba(211, 167, 95, 0.25)',
    },
    admin: {
      gradient: 'linear-gradient(135deg, rgba(211, 167, 95, 0.12) 0%, rgba(159, 120, 96, 0.08) 100%)',
      accent: 'var(--kc-gold-200)',
      iconBg: 'rgba(211, 167, 95, 0.18)',
    },
  };

  const config = roleConfig[role] || roleConfig.customer;

  // Default left panel content
  const defaultLeftContent = (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="auth-left-brand"
      >
        <div className="auth-brand-logo">
          <span className="kc-text-brand text-xs uppercase tracking-[0.45em]">The</span>
          <span className="text-4xl md:text-5xl font-serif font-semibold tracking-[0.4px] text-[var(--kc-cream-100)]">
            Kapda Co.
          </span>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="auth-brand-tagline"
        >
          Crafting timeless elegance through bespoke design
        </motion.p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="auth-left-decoration"
        style={{ background: config.gradient }}
      />
    </>
  );

  return (
    <div className="auth-two-panel-container">
      {/* Left Editorial Panel */}
      <motion.div
        className="auth-left-panel"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-left-content">
          {leftPanelContent || defaultLeftContent}
        </div>
        <div className="auth-left-overlay" />
      </motion.div>

      {/* Right Glass Login Card */}
      <motion.div
        className="auth-right-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={cn('auth-glass-card', className)}>
          <motion.div
            className="auth-card-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {icon && (
              <motion.div
                className="auth-icon-badge"
                style={{ background: config.iconBg }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              >
                {icon}
              </motion.div>
            )}
            {eyebrow && (
              <motion.span
                className="auth-eyebrow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {eyebrow}
              </motion.span>
            )}
            <motion.h1
              className="auth-title"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                className="auth-subtitle"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                {subtitle}
              </motion.p>
            )}
          </motion.div>

          <motion.div
            className="auth-card-body"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {children}
          </motion.div>

          {footer && (
            <motion.div
              className="auth-card-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {footer}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthShell;
