'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth, useNotifications } from '@/context/AppContext';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Share2,
  History,
  Bot,
  Settings,
  Bell,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  Check,
  Trash2,
  Building,
  Landmark,
  Sliders,
  Search,
  Award
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/context/AppContext';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
  } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Navigation options based on User Role
  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'STARTUP':
        return [
          { name: 'Dashboard', href: '/startup', icon: LayoutDashboard },
          { name: 'Documents', href: '/startup/documents', icon: FileText },
          { name: 'Verification Status', href: '/startup/verification', icon: ShieldCheck },
          { name: 'Compliance Passport', href: '/startup/passport', icon: Award },
          { name: 'Apply to Institution', href: '/startup/apply', icon: Landmark },
          { name: 'Applications & Sharing', href: '/startup/requests', icon: Share2 },
          { name: 'Compliance Advisor', href: '/startup/advisor', icon: Bot },
          { name: 'Audit Logs', href: '/startup/logs', icon: History },
          { name: 'Notifications', href: '/startup/notifications', icon: Bell },
          { name: 'Company Profile', href: '/startup/profile', icon: Building },
          { name: 'Settings', href: '/startup/settings', icon: Settings },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', href: '/admin?tab=overview', icon: LayoutDashboard },
        ];
      case 'INSTITUTION':
        return [
          { name: 'Applications Received', href: '/institution?tab=dashboard', icon: LayoutDashboard },
          { name: 'Search Startups', href: '/institution?tab=search', icon: Search },
          { name: 'Request History', href: '/institution?tab=requests', icon: History },
          { name: 'Shared Passports', href: '/institution?tab=passports', icon: ShieldCheck },
          { name: 'Analytics', href: '/institution?tab=analytics', icon: Sliders },
          { name: 'Settings', href: '/institution?tab=settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <aside className="w-64 bg-card/60 dark:bg-zinc-950/60 border-r border-border/40 flex flex-col h-screen sticky top-0 backdrop-blur-md z-30">
      {/* Header / Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border/40 justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-foreground to-neutral-500 bg-clip-text text-transparent light:text-foreground">
            COMPLIANCE PASSPORT
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = link.href.includes('?tab=')
            ? (pathname === '/admin' || pathname === '/institution') && activeTab === link.href.split('?tab=')[1]
            : pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 light:hover:bg-neutral-200/50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Controls */}
      <div className="p-4 border-t border-border/40 space-y-3 bg-zinc-900/10 dark:bg-black/10">
        {/* Quick Toggles */}
        <div className="flex items-center justify-between px-2 text-muted-foreground">
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 hover:text-foreground hover:bg-neutral-800/40 light:hover:bg-neutral-200/50 rounded-lg relative transition-colors"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>

            {/* Notifications Popover */}
            {notifOpen && (
              <div className="absolute bottom-12 left-0 w-80 glass rounded-2xl border border-border shadow-2xl p-4 z-40 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                  <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Alerts ({unreadCount})
                  </h4>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Clear all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No new alerts
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                          n.read
                            ? 'bg-transparent border-border/40 text-muted-foreground'
                            : 'bg-primary/5 border-primary/20 text-foreground'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold">{n.title}</span>
                          {!n.read && <Check className="h-3 w-3 text-indigo-400" />}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed">{n.message}</p>
                        <span className="mt-1.5 block text-[9px] text-muted-foreground/60">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:text-foreground hover:bg-neutral-800/40 light:hover:bg-neutral-200/50 rounded-lg transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3 p-2 bg-neutral-900/40 light:bg-neutral-200/30 rounded-2xl border border-border/20">
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-semibold">
                {user.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 hover:text-destructive rounded-lg text-muted-foreground hover:bg-destructive/10 transition-colors"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
