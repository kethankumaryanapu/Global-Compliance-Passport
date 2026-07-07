'use client';

import { useState } from 'react';
import { Building, ShieldCheck, MapPin, Eye, Sliders, Trash2, Calendar, FileText, User, X, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface AdminCompaniesProps {
  companies: any[];
  onActionComplete: () => void;
}

export default function AdminCompanies({ companies, onActionComplete }: AdminCompaniesProps) {
  const [search, setSearch] = useState('');
  const [selectedComp, setSelectedComp] = useState<any | null>(null);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.regNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusToggle = async (companyId: string, currentStatus: string) => {
    const action = currentStatus === 'TRUSTED' ? 'SUSPEND' : 'ACTIVATE';
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, action }),
      });

      if (res.ok) {
        toast.success(`Company status successfully updated to: ${action}ED`);
        if (selectedComp?.id === companyId) {
          // Sync state in the profile overlay as well
          setSelectedComp((prev: any) => ({
            ...prev,
            passport: { ...prev.passport, status: action === 'SUSPEND' ? 'UNTRUSTED' : 'TRUSTED' },
          }));
        }
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Toggle status failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update company status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('WARNING: Deleting this company will permanently remove the startup profile, verified credentials, and corporate user logins from the registry. Proceed?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/companies?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Company deleted successfully');
        setSelectedComp(null);
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Deletion failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete company');
    }
  };

  const getIndustryMock = (reg: string) => {
    if (reg.includes('1')) return 'Fintech';
    if (reg.includes('2')) return 'FoodTech & Logistics';
    if (reg.includes('3')) return 'SaaS Solutions';
    return 'Robotics & Hardware';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search directory */}
      <div className="flex bg-card/40 border border-border/40 rounded-2xl p-2 items-center gap-2 max-w-md">
        <Building className="h-4 w-4 text-muted-foreground/60 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search startups by name or CIN..."
          className="bg-transparent text-xs outline-none text-foreground w-full"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Startups Grid (Left Columns) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCompanies.length === 0 ? (
            <p className="col-span-2 text-center text-xs text-muted-foreground py-10">
              No startups matched the search filters.
            </p>
          ) : (
            filteredCompanies.map((c) => {
              const industry = getIndustryMock(c.regNumber);
              const isTrusted = c.passport?.status === 'TRUSTED';
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedComp(c)}
                  className={`bg-card/40 border rounded-3xl p-5 space-y-4 cursor-pointer hover:border-primary/40 transition-all ${
                    selectedComp?.id === c.id ? 'border-primary shadow shadow-primary/10' : 'border-border/40'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-foreground truncate max-w-[170px]" title={c.name}>
                        {c.name}
                      </h4>
                      <span className="text-[9px] bg-zinc-900/60 border border-border px-2 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-wider">
                        {industry}
                      </span>
                    </div>
                    {isTrusted ? (
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shrink-0">
                        TRUSTED
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shrink-0">
                        UNTRUSTED
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-border/20 pt-3">
                    <span className="text-zinc-500 font-medium">Compliance score:</span>
                    <span className="font-extrabold text-indigo-400">{c.complianceScore}%</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Documents: {c.documents?.length || 0} uploaded</span>
                    <span className="font-semibold text-primary flex items-center">
                      Profile Profile <ChevronRightIndicator className="h-3 w-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Company profile overlay (Right Column) */}
        {selectedComp ? (
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-5 lg:col-span-1 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <h3 className="text-sm font-bold text-foreground">Company Verification Profile</h3>
              <button onClick={() => setSelectedComp(null)} className="text-xs text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Corporate Email</span>
                <p className="font-medium text-foreground">{selectedComp.user?.email || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Registration Number</span>
                <p className="font-mono font-semibold text-foreground">{selectedComp.regNumber}</p>
              </div>

              {selectedComp.address && (
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">Registered Address</span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed flex items-start">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-zinc-500 shrink-0 mt-0.5" />
                    {selectedComp.address}
                  </p>
                </div>
              )}

              {/* Document checklists */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Filing Credentials</span>
                {(!selectedComp.documents || selectedComp.documents.length === 0) ? (
                  <p className="text-muted-foreground italic text-[11px]">No documents uploaded.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedComp.documents.map((doc: any) => (
                      <div key={doc.id} className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-border/30">
                        <span className="font-semibold text-[10px] text-foreground truncate max-w-[130px]" title={doc.name}>
                          {doc.name}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[8px] font-bold text-primary uppercase">{doc.type}</span>
                          <span className={`text-[8px] font-bold uppercase ${
                            doc.status === 'VERIFIED' ? 'text-emerald-400' : doc.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-500'
                          }`}>
                            {doc.status.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status toggles & Revoke Actions */}
              <div className="space-y-3.5 border-t border-border/40 pt-4">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Administrative Actions</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusToggle(selectedComp.id, selectedComp.passport?.status || 'UNTRUSTED')}
                    className={`flex-1 inline-flex items-center justify-center h-8 text-[10px] font-bold rounded-xl transition-all border ${
                      selectedComp.passport?.status === 'TRUSTED'
                        ? 'border-rose-500/20 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10'
                        : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                    }`}
                  >
                    {selectedComp.passport?.status === 'TRUSTED' ? (
                      <>
                        <Lock className="h-3 w-3 mr-1" /> Suspend Passport
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" /> Activate Passport
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(selectedComp.id)}
                    className="inline-flex items-center justify-center px-3 h-8 text-[10px] font-bold text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all"
                    title="Delete registry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card/20 border border-dashed border-border/60 rounded-3xl p-8 text-center space-y-3 text-xs text-muted-foreground">
            <Sliders className="h-8 w-8 mx-auto text-muted-foreground/30" />
            <p>Select a company startup from the list to inspect full documents, timeline, and administrative details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronRightIndicator(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
