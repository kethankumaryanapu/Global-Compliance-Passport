'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';
import {
  History,
  Upload,
  ShieldCheck,
  Share2,
  XCircle,
  Clock,
  Search,
  CheckCircle,
  ShieldAlert,
  User
} from 'lucide-react';
import { toast } from 'sonner';

export default function StartupLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load audit trails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.user?.name && log.user.name.toLowerCase().includes(q))
    );
  });

  const getLogIcon = (action: string) => {
    switch (action) {
      case 'UPLOAD':
        return (
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Upload className="h-4.5 w-4.5" />
          </div>
        );
      case 'VERIFY':
      case 'APPROVE':
        return (
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-4.5 w-4.5" />
          </div>
        );
      case 'REJECT':
      case 'REVOKE':
        return (
          <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
        );
      case 'SHARE':
        return (
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Share2 className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-xl bg-neutral-500/10 border border-neutral-500/20 text-neutral-400">
            <Clock className="h-4.5 w-4.5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Audit Logs</h1>
        <p className="text-xs text-muted-foreground">
          A tamper-proof ledger tracking all document uploads, compliance evaluations, and credential sharing approvals
        </p>
      </div>

      {/* Search Filter Bar */}
      <div className="flex bg-card/40 border border-border/40 rounded-2xl p-2 items-center gap-2 max-w-md shrink-0">
        <Search className="h-4 w-4 text-muted-foreground/60 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by action, details, or user..."
          className="bg-transparent text-xs w-full outline-none text-foreground"
        />
      </div>

      {/* Logs Timeline Wrapper */}
      <div className="bg-card/40 border border-border/40 rounded-3xl p-6 relative">
        {loading ? (
          <div className="space-y-3 py-10">
            <div className="h-10 bg-border/25 rounded-xl animate-pulse" />
            <div className="h-10 bg-border/25 rounded-xl animate-pulse" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-3">
            <History className="h-12 w-12 mx-auto text-muted-foreground/30 animate-float" />
            <div>
              <p className="text-sm font-semibold">No Logs Found</p>
              <p className="text-xs mt-1">Activities regarding uploads and consents will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-y-1 before:left-6 before:w-0.5 before:bg-border/60">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative flex items-start space-x-4 pl-0">
                {/* Timeline Icon */}
                <div className="relative z-10 shrink-0">
                  {getLogIcon(log.action)}
                </div>

                {/* Timeline details content */}
                <div className="flex-1 space-y-1 bg-zinc-900/10 border border-border/10 p-4 rounded-2xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-foreground capitalize flex items-center">
                      Action: {log.action.toLowerCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{log.details}</p>

                  <div className="flex items-center space-x-2 text-[10px] text-muted-foreground pt-1">
                    <User className="h-3.5 w-3.5" />
                    <span>Operator: {log.user?.name || 'System Auto-Processor'} ({log.user?.email || 'API Agent'})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
