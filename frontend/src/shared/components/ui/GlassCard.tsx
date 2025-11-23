import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import * as React from 'react';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
  variant?: 'default' | 'dark' | 'accent' | 'success' | 'warning' | 'danger';
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hover = true, glow = false, variant = 'default', ...props }, ref) => {
    const variants = {
      default: {
        background: 'bg-white/30 dark:bg-slate-900/30',
        border: 'border-white/20 dark:border-slate-700/50',
        shadow: 'shadow-glass'
      },
      dark: {
        background: 'bg-slate-900/40 dark:bg-slate-800/40',
        border: 'border-slate-700/50',
        shadow: 'shadow-glass'
      },
      accent: {
        background: 'bg-gradient-to-br from-blue-500/10 to-purple-500/10',
        border: 'border-blue-500/30',
        shadow: 'shadow-neon'
      },
      success: {
        background: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
        border: 'border-green-500/30',
        shadow: 'shadow-glass'
      },
      warning: {
        background: 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10',
        border: 'border-yellow-500/30',
        shadow: 'shadow-glass'
      },
      danger: {
        background: 'bg-gradient-to-br from-red-500/10 to-pink-500/10',
        border: 'border-red-500/30',
        shadow: 'shadow-glass'
      }
    };

    const variantStyles = variants[variant] || variants.default;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={hover ? {
          y: -5,
          scale: 1.02,
          transition: { duration: 0.2 }
        } : {}}
        className={cn(
          "relative overflow-hidden rounded-2xl backdrop-blur-xl border",
          variantStyles.background,
          variantStyles.border,
          variantStyles.shadow,
          glow && "shadow-neon",
          "transition-all duration-300",
          className
        )}
        {...props}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Floating particles effect */}
        {glow && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-float opacity-60" />
            <div className="absolute bottom-4 left-4 w-1 h-1 bg-purple-400 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-8 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-float opacity-50" style={{ animationDelay: '2s' }} />
          </div>
        )}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
