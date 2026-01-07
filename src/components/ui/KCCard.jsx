import React from 'react';
import { cn } from '../../lib/cn';

export const KCCard = React.forwardRef(({ className, as: Comp = 'div', children, interactive = false, muted = false, ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn('kc-card', interactive && 'kc-lift', muted && 'kc-surface-muted', className)}
    {...props}
  >
    {children}
  </Comp>
));

KCCard.displayName = 'KCCard';

export const KCCardHeader = ({ className, subtitle, eyebrow, children, ...props }) => (
  <div className={cn('flex flex-col gap-2', className)} {...props}>
    {eyebrow ? <span className="kc-badge uppercase tracking-[0.28em] text-[0.7rem]">{eyebrow}</span> : null}
    {children}
    {subtitle ? <p className="text-sm kc-text-muted">{subtitle}</p> : null}
  </div>
);

export const KCCardFooter = ({ className, children, ...props }) => (
  <div className={cn('mt-6 pt-4 border-t border-[var(--kc-border)] flex items-center justify-between flex-wrap gap-3', className)} {...props}>
    {children}
  </div>
);
