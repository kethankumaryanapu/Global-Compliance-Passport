'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useTheme, useNotifications } from '@/context/AppContext';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Building,
  Landmark,
  Bot,
  History,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  Trash2,
  Check,
  Globe
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'overview';

  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, markNotificationAsRead, clearAllNotifications } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const links = [
    { name: 'Dashboard', tab: 'overview', icon: LayoutDashboard },
    { name: 'Document Queue', tab: 'queue', icon: FileText },
    { name: 'Registered Startups', tab: 'companies', icon: Building },
    { name: 'Partner Institutions', tab: 'institutions', icon: Landmark },
    { name: 'AI Engine Pipeline', tab: 'ai', icon: Bot },
    { name: 'Compliance Passports', tab: 'passports', icon: ShieldCheck },
    { name: 'Audit Trail Logs', tab: 'logs', icon: History },
    { name: 'Compliance Rules', tab: 'rules', icon: Globe },
    { name: 'Console Settings', tab: 'settings', icon: Settings },
  ];

  const handleAdminLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success('Admin logged out successfully.');
        // Refresh local auth context states
        await logout();
        router.push('/admin/login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (e) {
      toast.error('Logout error occurred.');
    }
  };

  return (
    <aside className="w-64 bg-card/60 dark:bg-zinc-950/60 border-r border-border/40 flex flex-col h-screen sticky top-0 backdrop-blur-md z-30 shrink-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border/40 justify-between">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-xs tracking-wide bg-gradient-to-r from-foreground to-neutral-500 bg-clip-text text-transparent">
            GCP ADMIN PORTAL
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = activeTab === link.tab;
          const Icon = link.icon;
          return (
            <Link
              key={link.tab}
              href={`/admin/dashboard?tab=${link.tab}`}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 dark:hover:bg-neutral-200/10'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-4 border-t border-border/40 space-y-3 bg-zinc-900/10 dark:bg-black/10">
        <div className="flex items-center justify-between px-2 text-muted-foreground text-xs">
          {/* Notifications Alerts */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 hover:text-foreground hover:bg-neutral-800/40 rounded-lg relative transition-colors"
              aria-label="View system alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute bottom-12 left-0 w-80 glass rounded-2xl border border-border shadow-2xl p-4 z-40 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                  <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Admin Alerts ({unreadCount})
                  </h4>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Clear notifications"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-6">
                    No active notifications.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className="p-2 bg-zinc-900/45 rounded-xl border border-border/20 space-y-1 cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-[10px] text-foreground">{n.title}</span>
                          {!n.read && <Check className="h-3 w-3 text-indigo-400" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-normal">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggles */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:text-foreground hover:bg-neutral-800/40 rounded-lg transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Logout */}
          <button
            onClick={handleAdminLogout}
            className="p-2 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Log out of Administration"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center space-x-3 p-2 rounded-2xl bg-zinc-950/20 border border-border/30">
          <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
            {user?.name?.slice(0, 2) || 'AD'}
          </div>
          <div className="min-w-0 text-left">
            <span className="font-bold text-[10px] text-foreground block truncate leading-tight">{user?.name}</span>
            <span className="text-zinc-500 font-semibold text-[8px] uppercase tracking-wider block">GCP Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
