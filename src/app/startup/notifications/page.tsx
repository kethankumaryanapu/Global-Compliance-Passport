'use client';

import { useState } from 'react';
import { useNotifications } from '@/context/AppContext';
import {
  Bell,
  Check,
  CheckCircle,
  FileCheck,
  Share2,
  Trash2,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

export default function StartupNotifications() {
  const {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    refreshNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'VERIFIED':
        return (
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-4.5 w-4.5" />
          </div>
        );
      case 'REQUEST':
        return (
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Share2 className="h-4.5 w-4.5" />
          </div>
        );
      case 'EXPIRY':
        return (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
        );
      case 'SHARED':
        return (
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FileCheck className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-xl bg-neutral-500/10 border border-neutral-500/20 text-neutral-400">
            <Bell className="h-4.5 w-4.5" />
          </div>
        );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      if (unreadNotifs.length === 0) return;
      
      await Promise.all(unreadNotifs.map(n => markNotificationAsRead(n.id)));
      toast.success('All notifications marked as read.');
    } catch (e) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Notifications Center</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Monitor real-time updates from administrative verifiers and financial institutions
          </p>
        </div>
        
        <div className="flex items-center space-x-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center justify-center px-3.5 h-8 text-xs font-bold text-foreground bg-secondary hover:bg-neutral-800/80 rounded-xl transition-all border border-border/40 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Mark all read
          </button>
          <button
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="inline-flex items-center justify-center px-3.5 h-8 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/10 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear all
          </button>
        </div>
      </div>

      <div className="bg-card/40 border border-border/40 rounded-3xl p-6">
        {/* Toggle Filters */}
        <div className="flex border-b border-border/20 pb-4 mb-6 space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'unread'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground space-y-3">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 animate-pulse" />
            <div>
              <p className="text-sm font-semibold">No notifications</p>
              <p className="text-xs mt-1">
                {filter === 'unread' ? "You don't have any unread compliance alerts" : "You haven't received any notification logs yet"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && markNotificationAsRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-zinc-950/10 border-border/20 text-muted-foreground'
                    : 'bg-primary/5 border-primary/20 text-foreground hover:border-primary/40'
                }`}
              >
                <div className="shrink-0">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-foreground">{notif.title}</h4>
                    <span className="text-[9px] text-zinc-500 font-semibold shrink-0">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                </div>

                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
