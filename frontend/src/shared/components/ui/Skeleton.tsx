import { motion, Variants } from 'framer-motion';
import { cn } from '../../lib/utils';
import * as React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
  animate?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', animate = true, ...props }, ref) => {
    const variants = {
      default: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700',
      card: 'bg-gradient-to-r from-white/20 via-white/10 to-white/20 dark:from-slate-700/50 dark:via-slate-600/50 dark:to-slate-700/50',
      text: 'bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600',
      avatar: 'bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600 rounded-full',
      button: 'bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 dark:from-blue-800 dark:via-blue-700 dark:to-blue-800 rounded-xl'
    };

    const shimmerVariants: Variants = {
      initial: { x: '-100%' },
      animate: {
        x: '100%',
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-md',
          variants[variant] || variants.default,
          className
        )}
        {...props}
      >
        {animate && (
          <motion.div
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/20"
          />
        )}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton components
export const SkeletonCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('space-y-4 p-6', className)} {...props}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
);

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 4, className, ...props }) => (
  <div className={cn('space-y-3', className)} {...props}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-4 flex-1" />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`cell-${rowIndex}-${colIndex}`}
            className="h-8 flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 'md', className, ...props }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <Skeleton
      variant="avatar"
      className={cn(sizes[size] || sizes.md, className)}
      {...props}
    />
  );
};

interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className, ...props }) => (
  <div className={cn('space-y-2', className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={cn(
          'h-4',
          i === lines - 1 ? 'w-3/4' : 'w-full' // Last line shorter
        )}
      />
    ))}
  </div>
);

export const SkeletonButton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <Skeleton
    variant="button"
    className={cn('h-10 w-24', className)}
    {...props}
  />
);

// Complex skeleton for dashboard cards
export const SkeletonDashboardCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-6 space-y-4', className)} {...props}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>

    <div className="space-y-3">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-4 w-48" />
    </div>

    <div className="flex space-x-2">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-14" />
    </div>
  </div>
);

// Skeleton for charts/graphs
export const SkeletonChart: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('space-y-4', className)} {...props}>
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-32" />
      <div className="flex space-x-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
      </div>
    </div>

    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-8"
          style={{
            width: `${Math.random() * 40 + 60}%` // Random width between 60-100%
          }}
        />
      ))}
    </div>
  </div>
);

export { Skeleton };
export default Skeleton;
