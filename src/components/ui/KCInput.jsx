import React from 'react';
import { cn } from '../../lib/cn';

const variantMap = {
  default: 'kc-input',
  ghost: 'kc-input-ghost',
};

const KCInput = React.forwardRef(({
  id,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  variant = 'default',
  className,
  disabled,
  required,
  icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const hasError = Boolean(error);
  const classes = cn(
    variantMap[variant] ?? variantMap.default,
    hasError && 'kc-input-error',
    icon && iconPosition === 'left' && 'kc-input-with-icon-left',
    icon && iconPosition === 'right' && 'kc-input-with-icon-right',
    className
  );

  const inputElement = (
    <input
      ref={ref}
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={classes}
      aria-invalid={hasError ? 'true' : 'false'}
      aria-describedby={hasError && id ? `${id}-error` : undefined}
      {...props}
    />
  );

  return (
    <div className="kc-input-wrapper">
      {icon && iconPosition === 'left' && (
        <span className="kc-input-icon-left" aria-hidden="true">
          {icon}
        </span>
      )}
      {inputElement}
      {icon && iconPosition === 'right' && (
        <span className="kc-input-icon-right" aria-hidden="true">
          {icon}
        </span>
      )}
      {hasError && (
        <span
          id={id ? `${id}-error` : undefined}
          className="kc-input-error-message"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
});

KCInput.displayName = 'KCInput';

export default KCInput;
