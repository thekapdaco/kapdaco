import React from 'react';
import { cn } from '../../lib/cn';

const baseStyles = 'rounded-[var(--kc-radius)] border px-4 py-3 text-sm shadow-none backdrop-blur-sm';

const variantMap = {
  neutral: 'border-[var(--kc-border)] bg-[var(--kc-card)] text-[var(--kc-ink)]',
  info: 'border-[var(--kc-gold-1)] bg-[var(--kc-gold-1)]/10 text-[var(--kc-gold-2)]',
  danger: 'border-[var(--kc-danger)] bg-[var(--kc-danger)]/10 text-[var(--kc-danger)]',
  success: 'border-[var(--kc-success)] bg-[var(--kc-success)]/10 text-[var(--kc-success)]',
};

const KCAlert = ({ variant = 'neutral', className, children, ...props }) => (
  <div
    className={cn(baseStyles, variantMap[variant] ?? variantMap.neutral, className)}
    role="alert"
    {...props}
  >
    {children}
  </div>
);

export default KCAlert;
