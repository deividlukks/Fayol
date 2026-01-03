import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NavigationItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string | number;
  active?: boolean;
  onClick?: () => void;
  children?: NavigationItem[];
}

export interface NavigationProps {
  items: NavigationItem[];
  className?: string;
  variant?: 'sidebar' | 'horizontal';
}

export function Navigation({ items, className, variant = 'sidebar' }: NavigationProps) {
  const renderItem = (item: NavigationItem, depth = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.label}>
        <button
          onClick={item.onClick}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            item.active
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-700 hover:bg-slate-100',
            variant === 'horizontal' && 'inline-flex w-auto',
            depth > 0 && 'ml-4'
          )}
        >
          {Icon && <Icon className="h-5 w-5 shrink-0" />}
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                item.active
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              {item.badge}
            </span>
          )}
        </button>
        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav
      className={cn(
        variant === 'sidebar' ? 'space-y-1 p-4' : 'flex gap-2',
        className
      )}
    >
      {items.map((item) => renderItem(item))}
    </nav>
  );
}
