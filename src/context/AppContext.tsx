'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export type UserRole = 'STARTUP' | 'INSTITUTION' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string | null;
  companyName?: string | null;
  complianceScore?: number | null;
  institutionId?: string | null;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'VERIFIED' | 'REQUEST' | 'EXPIRY' | 'SHARED' | 'COMMENT';
  read: boolean;
  createdAt: string;
}

interface AppContextProps {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Auth
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Notifications
  notifications: SystemNotification[];
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Theme state (default dark)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Notifications state
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Sync class name for theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    const activeTheme = savedTheme || 'dark';
    setTheme(activeTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  // Fetch current user session
  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to retrieve user session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user notifications
  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to retrieve notifications:', error);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?clear=true', {
        method: 'DELETE',
      });
      if (response.ok) {
        setNotifications([]);
        toast.success('All notifications cleared');
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  // Perform custom JWT login redirect
  const login = (token: string, userData: AuthUser) => {
    setUser(userData);
    toast.success(`Welcome back, ${userData.name}!`);
    
    // Redirect based on role
    if (userData.role === 'STARTUP') router.push('/startup');
    else if (userData.role === 'ADMIN') router.push('/admin');
    else if (userData.role === 'INSTITUTION') router.push('/institution');
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setNotifications([]);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  // Fetch user session on load
  useEffect(() => {
    refreshUser();
  }, [pathname]); // Refresh user on navigation to keep roles synced

  // Fetch notifications once user is authenticated
  useEffect(() => {
    if (user) {
      refreshNotifications();
      // Polling for notifications in mock workspace every 15s
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        loading,
        login,
        logout,
        refreshUser,
        notifications,
        refreshNotifications,
        markNotificationAsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useTheme must be used within an AppProvider');
  return { theme: context.theme, toggleTheme: context.toggleTheme };
}

export function useAuth() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAuth must be used within an AppProvider');
  return {
    user: context.user,
    loading: context.loading,
    login: context.login,
    logout: context.logout,
    refreshUser: context.refreshUser,
  };
}

export function useNotifications() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useNotifications must be used within an AppProvider');
  return {
    notifications: context.notifications,
    refreshNotifications: context.refreshNotifications,
    markNotificationAsRead: context.markNotificationAsRead,
    clearAllNotifications: context.clearAllNotifications,
  };
}
