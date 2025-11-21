import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import * as React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  glow?: boolean;
  icon?: React.ElementType;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, glow = false, icon: Icon, className, ...props }, ref) => {
    const variants = {
      primary: {
        background: 'bg-gradient-to-r from-blue-500/20 to-purple-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-600 dark:text-blue-400',
        hover: 'hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-500/50',
        shadow: glow ? 'shadow-neon' : 'shadow-glass-sm'
      },
      secondary: {
        background: 'bg-gradient-to-r from-slate-500/20 to-slate-600/20',
        border: 'border-slate-500/30',
        text: 'text-slate-600 dark:text-slate-400',
        hover: 'hover:from-slate-500/30 hover:to-slate-600/30 hover:border-slate-500/50',
        shadow: 'shadow-glass-sm'
      },
      success: {
        background: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
        border: 'border-green-500/30',
        text: 'text-green-600 dark:text-green-400',
        hover: 'hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-500/50',
        shadow: 'shadow-glass-sm'
      },
      danger: {
        background: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
        border: 'border-red-500/30',
        text: 'text-red-600 dark:text-red-400',
        hover: 'hover:from-red-500/30 hover:to-pink-500/30 hover:border-red-500/50',
        shadow: 'shadow-glass-sm'
      },
      ghost: {
        background: 'bg-transparent',
        border: 'border-white/20 dark:border-slate-700/50',
        text: 'text-slate-600 dark:text-slate-400',
        hover: 'hover:bg-white/10 dark:hover:bg-slate-700/30 hover:border-white/30 dark:hover:border-slate-600/50',
        shadow: 'shadow-none'
      }
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg',
      xl: 'px-8 py-5 text-xl'
    };

    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size] || sizes.md;

    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
        disabled={disabled || loading}
        className={cn(
          "relative overflow-hidden rounded-xl backdrop-blur-xl border font-medium transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          variantStyles.background,
          variantStyles.border,
          variantStyles.text,
          variantStyles.hover,
          variantStyles.shadow,
          sizeStyles,
          "flex items-center justify-center space-x-2",
          className
        )}
        {...props}
      >
        {/* Background gradient animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />

        {/* Loading spinner */}
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}

        {/* Icon */}
        {Icon && !loading && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Icon className="w-4 h-4" />
          </motion.div>
        )}

        {/* Content */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          {loading ? 'Loading...' : children}
        </motion.span>

        {/* Glow effect */}
        {glow && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        )}

        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
        </div>
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export default GlassButton;
