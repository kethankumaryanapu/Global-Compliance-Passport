'use client';

import { useState } from 'react';
import { ShieldCheck, User, Calendar, FileText, Share2, Search, Sliders, ChevronDown } from 'lucide-react';

interface AdminAuditLogsProps {
  logs: any[];
}

export default function AdminAuditLogs({ logs }: AdminAuditLogsProps) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      log.details.toLowerCase().includes(q) ||
      (log.company?.name && log.company.name.toLowerCase().includes(q)) ||
      (log.user?.name && log.user.name.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;

    return true;
  });

  const getLogIcon = (action: string) => {
    switch (action) {
      case 'UPLOAD':
        return <FileText className="h-4 w-4 text-sky-400" />;
      case 'SHARE':
        return <Share2 className="h-4 w-4 text-purple-400" />;
      case 'APPROVE':
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case 'REJECT':
      case 'REVOKE':
        return <ShieldCheck className="h-4 w-4 text-rose-500" />;
      default:
        return <User className="h-4 w-4 text-indigo-400" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'UPLOAD':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold">Filing Upload</span>;
      case 'SHARE':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold">Passport Share</span>;
      case 'APPROVE':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold">Registry Verified</span>;
      case 'REJECT':
      case 'REVOKE':
        return <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold">Revoked Access</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-400 border border-border px-1.5 py-0.5 rounded text-[8px] font-bold">{action}</span>;
    }
  };

  return (
    <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-6 animate-in fade-in duration-300">
      {/* Filters block */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex bg-zinc-950/40 border border-border rounded-xl p-2 items-center gap-2 w-64">
          <Search className="h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities by log contents..."
            className="bg-transparent text-xs outline-none text-foreground w-full"
          />
        </div>

        {/* Action filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs border border-border bg-card/60 p-2.5 rounded-xl text-foreground outline-none"
        >
          <option value="ALL">Filter: All Events</option>
          <option value="UPLOAD">Filter: Filings Uploaded</option>
          <option value="APPROVE">Filter: Approvals</option>
          <option value="SHARE">Filter: Sharing Consents</option>
          <option value="REVOKE">Filter: Revokes</option>
        </select>
      </div>

      {/* Timeline list */}
      <div className="relative border-l border-border/40 pl-6 space-y-6">
        {filteredLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 pl-2">
            No system audit logs matched your query.
          </p>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="relative group">
              {/* Left node indicator */}
              <div className="absolute -left-[35px] top-1 bg-zinc-950 border border-border/60 p-1.5 rounded-full group-hover:border-primary transition-all">
                {getLogIcon(log.action)}
              </div>

              {/* Log content */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-semibold text-foreground">
                    {log.user?.name || 'System Operator'}
                  </span>
                  {getActionBadge(log.action)}
                  <span className="text-[10px] text-muted-foreground flex items-center font-mono font-medium">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {log.details}
                </p>
                {log.company && (
                  <span className="inline-block text-[9px] uppercase font-bold text-zinc-500">
                    Startup Entity: {log.company.name}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
