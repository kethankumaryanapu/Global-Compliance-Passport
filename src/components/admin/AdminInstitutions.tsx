'use client';

import { useState } from 'react';
import { Landmark, User, ShieldAlert, ShieldCheck, Mail, Sliders, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminInstitutionsProps {
  institutions: any[];
  onActionComplete: () => void;
}

export default function AdminInstitutions({ institutions, onActionComplete }: AdminInstitutionsProps) {
  const [search, setSearch] = useState('');

  const filteredInsts = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(search.toLowerCase()) ||
    (inst.user?.email && inst.user.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStatusToggle = async (institutionId: string, isSuspended: boolean) => {
    const action = isSuspended ? 'ACTIVATE' : 'SUSPEND';
    try {
      const res = await fetch('/api/admin/institutions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionId, action }),
      });

      if (res.ok) {
        toast.success(`Institution permissions updated to: ${action}ED`);
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Action failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update institution access.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this institution account? This will revoke all their passport consent sharing access.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/institutions?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Institution account deleted successfully');
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Deletion failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete institution');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search filters */}
      <div className="flex bg-card/40 border border-border/40 rounded-2xl p-2 items-center gap-2 max-w-md">
        <Landmark className="h-4 w-4 text-muted-foreground/60 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search institutions by corporate email or name..."
          className="bg-transparent text-xs outline-none text-foreground w-full"
        />
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInsts.length === 0 ? (
          <p className="col-span-3 text-center text-xs text-muted-foreground py-10">
            No institutions matching the filter.
          </p>
        ) : (
          filteredInsts.map((inst) => {
            const isSuspended = inst.description?.startsWith('[SUSPENDED]');
            const displayDesc = isSuspended
              ? inst.description.replace('[SUSPENDED] ', '')
              : inst.description || 'No description provided.';

            return (
              <div
                key={inst.id}
                className={`bg-card/40 border rounded-3xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  isSuspended ? 'border-rose-500/20' : 'border-border/40 hover:border-primary/40'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 max-w-[160px]">
                      <h4 className="text-sm font-bold text-foreground truncate" title={inst.name}>
                        {inst.name}
                      </h4>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{inst.user?.email}</p>
                    </div>

                    {isSuspended ? (
                      <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shrink-0">
                        <ShieldAlert className="h-3 w-3 mr-1" />
                        Suspended
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shrink-0">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {displayDesc}
                  </p>
                </div>

                {/* Rating & Action parameters */}
                <div className="space-y-4 border-t border-border/20 pt-4 mt-auto">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Access Requests:</span>
                    <span className="font-extrabold text-indigo-400">{inst.requests?.length || 0} sent</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 text-[10px]">
                    <button
                      onClick={() => handleStatusToggle(inst.id, isSuspended)}
                      className={`flex-1 inline-flex items-center justify-center h-8 font-bold rounded-xl transition-all border ${
                        isSuspended
                          ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                          : 'border-rose-500/20 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10'
                      }`}
                    >
                      {isSuspended ? 'Activate Access' : 'Suspend Access'}
                    </button>
                    <button
                      onClick={() => handleDelete(inst.id)}
                      className="inline-flex items-center justify-center px-3 h-8 font-bold text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all"
                      title="Delete profile"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
