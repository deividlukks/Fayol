import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80',
      secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80',
      success: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-600',
      warning: 'border-transparent bg-amber-500 text-white hover:bg-amber-600',
      danger: 'border-transparent bg-red-500 text-white hover:bg-red-600',
      outline: 'text-slate-950 border-slate-200',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
