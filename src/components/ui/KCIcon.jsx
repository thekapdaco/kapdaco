import React from 'react';
import * as Icons from 'lucide-react';

const DEFAULT_SIZE = 22;

const KCIcon = ({ name, size = DEFAULT_SIZE, strokeWidth = 1.6, className = '', color = 'currentColor', ...props }) => {
  const Icon = name ? Icons[name] : null;

  if (!Icon) {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`KCIcon: icon "${name}" was not found in lucide-react.`);
    }
    return null;
  }

  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      color={color}
      {...props}
    />
  );
};

export default KCIcon;
