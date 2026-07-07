'use client';

import { useState } from 'react';
import { ShieldCheck, Award, Calendar, FileDown, Lock, RefreshCw, Eye, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPassportsProps {
  passports: any[];
  onActionComplete: () => void;
}

export default function AdminPassports({ passports, onActionComplete }: AdminPassportsProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredPassports = passports.filter((pass) => {
    const q = search.toLowerCase();
    const matchesSearch =
      pass.passportId.toLowerCase().includes(q) ||
      pass.company.name.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && pass.status !== statusFilter) return false;

    return true;
  });

  const handlePassportAction = async (passportId: string, action: 'REVOKE' | 'RENEW') => {
    try {
      const res = await fetch('/api/admin/passports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passportId, action }),
      });

      if (res.ok) {
        toast.success(`Passport successfully ${action === 'REVOKE' ? 'revoked' : 'renewed'}!`);
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Action failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update passport authorization.');
    }
  };

  const handleExportCSV = () => {
    if (filteredPassports.length === 0) return;
    
    // Generate CSV content
    const headers = ['Passport ID', 'Company', 'Compliance Score', 'Status', 'Issue Date', 'Expiry Date'];
    const rows = filteredPassports.map((p) => [
      p.passportId,
      p.company.name,
      `${p.complianceScore}%`,
      p.status,
      new Date(p.generatedAt).toLocaleDateString(),
      new Date(p.expiresAt).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = window.document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Compliance_Passports_Report_${Date.now()}.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    toast.success('Passports CSV downloaded successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-6 animate-in fade-in duration-300">
      {/* Search and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex bg-zinc-950/40 border border-border rounded-xl p-2 items-center gap-2 w-60">
            <Search className="h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search passports by ID or company..."
              className="bg-transparent text-xs outline-none text-foreground w-full"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-border bg-card/60 p-2.5 rounded-xl text-foreground outline-none"
          >
            <option value="ALL">Filter: All Passports</option>
            <option value="TRUSTED">Filter: Trusted Only</option>
            <option value="UNTRUSTED">Filter: Suspended Only</option>
          </select>
        </div>

        {/* Exports */}
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 h-8 text-xs font-bold text-foreground bg-secondary hover:bg-neutral-800/80 rounded-xl transition-colors border border-border"
          >
            <FileDown className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3.5 h-8 text-xs font-bold text-foreground bg-secondary hover:bg-neutral-800/80 rounded-xl transition-colors border border-border"
          >
            Print Registry
          </button>
        </div>
      </div>

      {/* Grid Datatable */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
              <th className="py-3 px-2">Passport ID</th>
              <th className="py-3 px-2">Company</th>
              <th className="py-3 px-2">Compliance Score</th>
              <th className="py-3 px-2">Generated On</th>
              <th className="py-3 px-2">Expires On</th>
              <th className="py-3 px-2">Trust Badge</th>
              <th className="py-3 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/45">
            {filteredPassports.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                  No compliance passports found in registry.
                </td>
              </tr>
            ) : (
              filteredPassports.map((p) => {
                const isTrusted = p.status === 'TRUSTED';
                return (
                  <tr key={p.id} className="hover:bg-neutral-800/10 transition-colors text-muted-foreground">
                    <td className="py-4 px-2 font-mono font-bold text-foreground">{p.passportId}</td>
                    <td className="py-4 px-2 font-bold text-foreground">{p.company.name}</td>
                    <td className="py-4 px-2 font-extrabold text-indigo-400">{p.complianceScore}%</td>
                    <td className="py-4 px-2">{new Date(p.generatedAt).toLocaleDateString()}</td>
                    <td className="py-4 px-2">{new Date(p.expiresAt).toLocaleDateString()}</td>
                    <td className="py-4 px-2">
                      {isTrusted ? (
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit">
                          TRUSTED
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit">
                          REVOKED
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-right space-x-1.5">
                      {isTrusted ? (
                        <button
                          onClick={() => handlePassportAction(p.id, 'REVOKE')}
                          className="inline-flex items-center justify-center p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-border"
                          title="Revoke trust authorization"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePassportAction(p.id, 'RENEW')}
                          className="inline-flex items-center justify-center p-1.5 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-border"
                          title="Renew and extend passport"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
