import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SidebarProps {
  className?: string;
  children: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  width?: 'sm' | 'md' | 'lg';
  position?: 'left' | 'right';
}

export function Sidebar({
  className,
  children,
  isOpen = true,
  onClose,
  width = 'md',
  position = 'left',
}: SidebarProps) {
  const widths = {
    sm: 'w-56',
    md: 'w-64',
    lg: 'w-72',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 z-50 bg-white border-slate-200 transition-transform duration-300',
          widths[width],
          position === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          !isOpen && (position === 'left' ? '-translate-x-full' : 'translate-x-full'),
          'lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header with close button (mobile only) */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 lg:hidden">
            <h2 className="font-semibold text-slate-900">Menu</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </aside>
    </>
  );
}
