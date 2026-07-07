'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AppContext';
import { User, ShieldCheck, Mail, ShieldAlert, Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminProfile() {
  const { user } = useAuth();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword.trim()) {
      toast.error('Both password fields are required.');
      return;
    }

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      setOldPassword('');
      setNewPassword('');
      toast.success('Administrative password updated successfully.');
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {/* Profile Card */}
      <div className="bg-card/45 border border-border/40 rounded-3xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground flex items-center">
          <User className="h-4.5 w-4.5 text-primary mr-2" />
          Administrative Identity Card
        </h3>

        <div className="space-y-4 text-xs">
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-zinc-950/20 border border-border/30">
            <div className="h-12 w-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg uppercase shrink-0">
              {user?.name?.slice(0, 2) || 'AD'}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm text-foreground block leading-tight">{user?.name}</span>
              <span className="text-zinc-500 font-semibold text-[10px] uppercase tracking-wider block">GCP System Administrator</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center py-2 border-b border-border/10">
              <span className="text-zinc-500">Corporate Email:</span>
              <span className="font-medium text-foreground">{user?.email || 'admin@gcp.com'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/10">
              <span className="text-zinc-500">Security Clearence:</span>
              <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] flex items-center">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Root Authority
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-500">Session Status:</span>
              <span className="text-foreground font-semibold">Active Authorized (24h validity)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Form */}
      <div className="bg-card/45 border border-border/40 rounded-3xl p-6">
        <h3 className="text-sm font-bold text-foreground flex items-center mb-4">
          <Key className="h-4.5 w-4.5 text-primary mr-2" />
          Update Security Key
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block text-[10px] text-zinc-500 uppercase font-semibold">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] text-zinc-500 uppercase font-semibold">New Security Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters..."
              className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 h-9 text-xs font-bold text-white bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Password Update'}
          </button>
        </form>
      </div>
    </div>
  );
}
