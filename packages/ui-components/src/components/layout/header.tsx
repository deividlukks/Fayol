import { ReactNode } from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
  title?: string;
  actions?: ReactNode;
  showNotifications?: boolean;
  showUser?: boolean;
  onNotificationClick?: () => void;
  onUserClick?: () => void;
  notificationCount?: number;
}

export function Header({
  className,
  onMenuClick,
  title,
  actions,
  showNotifications = true,
  showUser = true,
  onNotificationClick,
  onUserClick,
  notificationCount = 0,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-slate-200 bg-white',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {title && <h1 className="text-xl font-semibold text-slate-900">{title}</h1>}
        </div>

        <div className="flex items-center gap-2">
          {actions}

          {showNotifications && (
            <button
              onClick={onNotificationClick}
              className="relative p-2 rounded-lg hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {showUser && (
            <button
              onClick={onUserClick}
              className="p-2 rounded-lg hover:bg-slate-100"
              aria-label="User menu"
            >
              <User className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
