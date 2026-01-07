import React from 'react';
import { motion } from 'framer-motion';
import { skeletonVariants } from '../../lib/motionVariants';

/**
 * Skeleton loader component for placeholder content
 * Matches the layout of actual content to prevent layout shift
 */
const Skeleton = ({ 
  className = '', 
  width, 
  height, 
  rounded = true,
  variant = 'default', // 'default', 'text', 'circular', 'rectangular'
  ...props 
}) => {
  const baseClasses = 'bg-white/10';
  
  const variantClasses = {
    default: rounded ? 'rounded-[var(--kc-radius)]' : '',
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
  };

  const style = {
    width: width || '100%',
    height: height || '1rem',
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      variants={skeletonVariants}
      animate="animate"
      {...props}
    />
  );
};

/**
 * Product Card Skeleton - matches ProductCard layout
 */
export const ProductCardSkeleton = ({ className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    <Skeleton 
      height="400px" 
      className="aspect-[4/5] w-full"
      variant="rectangular"
    />
    <Skeleton height="20px" width="80%" variant="text" />
    <div className="flex items-center justify-between">
      <Skeleton height="24px" width="100px" variant="text" />
      <Skeleton height="32px" width="60px" variant="rectangular" rounded />
    </div>
  </div>
);

/**
 * Text Skeleton - for paragraphs, headings, etc.
 */
export const TextSkeleton = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="1rem"
        width={i === lines - 1 ? '60%' : '100%'}
        variant="text"
      />
    ))}
  </div>
);

/**
 * Avatar Skeleton
 */
export const AvatarSkeleton = ({ size = 40, className = '' }) => (
  <Skeleton
    width={size}
    height={size}
    variant="circular"
    className={className}
  />
);

/**
 * Button Skeleton
 */
export const ButtonSkeleton = ({ width = 120, height = 40, className = '' }) => (
  <Skeleton
    width={width}
    height={height}
    variant="rectangular"
    className={className}
  />
);

/**
 * List Item Skeleton
 */
export const ListItemSkeleton = ({ className = '' }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <AvatarSkeleton size={48} />
    <div className="flex-1 space-y-2">
      <Skeleton height="16px" width="70%" variant="text" />
      <Skeleton height="14px" width="50%" variant="text" />
    </div>
  </div>
);

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton = ({ columns = 4, className = '' }) => (
  <tr className={className}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton height="16px" width={i === 0 ? '60%' : '80%'} variant="text" />
      </td>
    ))}
  </tr>
);

/**
 * Grid Skeleton - for product grids, card grids, etc.
 */
export const GridSkeleton = ({ 
  items = 6, 
  columns = 3,
  renderItem = ProductCardSkeleton,
  className = '' 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  // Use the component directly with JSX syntax
  const ItemComponent = renderItem || ProductCardSkeleton;

  return (
    <div className={`grid gap-6 ${gridCols[columns] || gridCols[3]} ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <ItemComponent key={i} />
      ))}
    </div>
  );
};

export default Skeleton;

