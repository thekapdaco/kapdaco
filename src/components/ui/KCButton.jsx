import React from 'react';
import { cn } from '../../lib/cn';

const baseStyles = 'kc-btn';

const variantMap = {
  default: baseStyles,
  primary: baseStyles,
  gold: baseStyles,
  secondary: cn(baseStyles, 'kc-btn-secondary'),
  glass: cn(baseStyles, 'kc-btn-secondary'),
  ghost: cn(baseStyles, 'kc-btn-ghost'),
  tertiary: cn(baseStyles, 'kc-btn-ghost'),
  icon: 'kc-icon-btn',
};

const KCButton = React.forwardRef(({
  as: Comp = 'button',
  variant = 'default',
  className,
  children,
  icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const classes = cn(variantMap[variant] ?? baseStyles, className);

  return (
    <Comp ref={ref} className={classes} {...props}>
      {icon && iconPosition === 'left' ? icon : null}
      {children}
      {icon && iconPosition === 'right' ? icon : null}
    </Comp>
  );
});

KCButton.displayName = 'KCButton';

export default KCButton;
