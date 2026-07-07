'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';
import {
  Share2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Landmark,
  ShieldCheck,
  Eye,
  Sliders,
  Check,
  ShieldAlert,
  CalendarClock,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function StartupRequests() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [verifiedDocs, setVerifiedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Request details popup
  const [viewReqDetails, setViewReqDetails] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqsRes, docsRes] = await Promise.all([
        fetch('/api/requests'),
        fetch('/api/documents'),
      ]);

      const [reqsData, docsData] = await Promise.all([
        reqsRes.json(),
        docsRes.json(),
      ]);

      setRequests(reqsData.requests || []);
      setVerifiedDocs((docsData.documents || []).filter(
        (d: any) => d.status === 'VERIFIED' || d.status === 'AI_VALIDATED' || d.status === 'Verified'
      ));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load application history.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawApplication = async (requestId: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This will revoke access immediately.')) {
      return;
    }

    try {
      const response = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status: 'REJECTED'
        }),
      });

      if (response.ok) {
        toast.success(`Application successfully withdrawn.`);
        setViewReqDetails(null);
        fetchData();
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Action failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not withdraw application');
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center w-fit animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            Submitted
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center w-fit">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center w-fit">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center w-fit">
            <XCircle className="h-3 w-3 mr-1" />
            Withdrawn / Rejected
          </span>
        );
      case 'ADDITIONAL_DOCUMENTS_REQUESTED':
        return (
          <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center w-fit animate-pulse">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Additional Documents Requested
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center w-fit">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      default:
        if (status === 'APPROVED' || status === 'PARTIAL') {
          return (
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center w-fit">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </span>
          );
        }
        return (
          <span className="bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center w-fit">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Applications & Consent</h1>
          <p className="text-xs text-muted-foreground">
            Track the status of your applications and manage voluntarily shared document permissions in real-time.
          </p>
        </div>
        <button
          onClick={() => router.push('/startup/apply')}
          className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Apply to Partner
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Applications Ledger (Left Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6">
            <h3 className="text-base font-semibold mb-4 text-foreground flex items-center">
              <Share2 className="h-4.5 w-4.5 text-primary mr-2" />
              Sent Application History
            </h3>

            {loading ? (
              <div className="space-y-3 py-10">
                <div className="h-12 bg-border/25 rounded-xl animate-pulse" />
                <div className="h-12 bg-border/25 rounded-xl animate-pulse" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-3 border border-dashed border-border/40 rounded-2xl">
                <Landmark className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <div>
                  <p className="text-xs font-semibold">No Applications Submitted</p>
                  <p className="text-[10px] mt-0.5">Click "Apply to Partner" to submit your compliance portfolio.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {requests.map((req) => {
                  const sharedDocIds: string[] = JSON.parse(req.sharedDocuments || '[]');
                  const sharedDocNames = verifiedDocs
                    .filter((d) => sharedDocIds.includes(d.id))
                    .map((d) => d.name);

                  return (
                    <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between py-5 gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Landmark className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-foreground truncate">
                            {req.institution.name}
                          </span>
                          <span className="text-[9px] bg-border text-foreground px-2 py-0.5 rounded font-bold shrink-0">
                            {req.purpose || 'Business Application'}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground leading-normal truncate max-w-lg">
                          Shared Credentials:{' '}
                          <span className="font-semibold text-foreground">
                            {sharedDocNames.join(', ') || (req.sharePassport ? 'Compliance Passport Summary Only' : 'None')}
                          </span>
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500 font-semibold">
                          <span className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Applied: {new Date(req.requestedAt).toLocaleDateString()}
                          </span>
                          {req.respondedAt && (
                            <span className="flex items-center text-emerald-400">
                              <CalendarClock className="h-3.5 w-3.5 mr-1" />
                              Decided: {new Date(req.respondedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5 self-end md:self-auto shrink-0">
                        {getStatusBadge(req.status)}
                        
                        <button
                          onClick={() => setViewReqDetails(req)}
                          className="inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 rounded-xl transition-all border border-border/40"
                        >
                          Details
                        </button>
                        
                        {req.status !== 'REJECTED' && req.status !== 'APPROVED' && req.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleWithdrawApplication(req.id)}
                            className="inline-flex items-center justify-center px-3 h-8 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/10"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Sidebar Application Details (Right Column) */}
        <div className="lg:col-span-1 space-y-6">
          {viewReqDetails ? (
            <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <h3 className="text-sm font-bold text-foreground">Application Details</h3>
                <button
                  onClick={() => setViewReqDetails(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Institution Partner</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">{viewReqDetails.institution.name}</p>
                  <p className="text-muted-foreground text-[10px] leading-relaxed mt-0.5">
                    {viewReqDetails.institution.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Selected Purpose</span>
                  <p className="font-semibold text-foreground mt-0.5">{viewReqDetails.purpose || 'Compliance Review'}</p>
                </div>

                {viewReqDetails.additionalDocsRequest && (
                  <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider flex items-center">
                      <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                      Additional Documents Requested
                    </span>
                    {(() => {
                      try {
                        const parsed = JSON.parse(viewReqDetails.additionalDocsRequest);
                        return (
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">Message: <span className="font-normal text-muted-foreground">{parsed.message}</span></p>
                            <p className="font-semibold text-foreground">Priority: <span className="font-mono text-rose-400 font-bold">{parsed.priority}</span></p>
                            <p className="font-semibold text-foreground">Due Date: <span className="font-mono font-bold text-foreground">{parsed.dueDate}</span></p>
                            {parsed.documentTypes && parsed.documentTypes.length > 0 && (
                              <div>
                                <span className="font-semibold text-foreground block mb-1">Requested Types:</span>
                                <div className="flex flex-wrap gap-1">
                                  {parsed.documentTypes.map((t: string) => (
                                    <span key={t} className="bg-zinc-950/40 border border-border/20 text-foreground px-2 py-0.5 rounded text-[9px] font-mono">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } catch (e) {
                        return <p className="text-[10px] text-muted-foreground">{viewReqDetails.additionalDocsRequest}</p>;
                      }
                    })()}
                  </div>
                )}

                {viewReqDetails.additionalNotes && (
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Startup Notes</span>
                    <p className="text-muted-foreground leading-relaxed bg-zinc-950/20 p-2.5 rounded-xl border border-border/10 mt-1 font-mono text-[10.5px]">
                      {viewReqDetails.additionalNotes}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Voluntarily Shared Passport</span>
                  <p className="font-semibold text-foreground mt-0.5">{viewReqDetails.sharePassport ? 'Yes, Shared' : 'No'}</p>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Requested Document Types</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {JSON.parse(viewReqDetails.documentTypes || '[]').length === 0 ? (
                      <span className="text-zinc-500 italic">None requested</span>
                    ) : (
                      JSON.parse(viewReqDetails.documentTypes || '[]').map((type: string) => (
                        <span key={type} className="bg-primary/10 border border-primary/20 text-foreground px-2 py-0.5 rounded text-[9px] font-mono font-semibold">
                          {type}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/10 space-y-1 text-[10px] text-zinc-500">
                  <p>Applied on: {new Date(viewReqDetails.requestedAt).toLocaleString()}</p>
                  {viewReqDetails.respondedAt && (
                    <p>Last Decision Action: {new Date(viewReqDetails.respondedAt).toLocaleString()}</p>
                  )}
                  <p>Application ID: <span className="font-mono">{viewReqDetails.id}</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card/20 border border-border/30 rounded-3xl p-5 text-xs space-y-3">
              <h4 className="font-bold text-foreground">Status Explanations</h4>
              <div className="space-y-2.5 text-muted-foreground text-[11px] leading-relaxed">
                <div>
                  <span className="font-bold text-amber-500">Submitted:</span> The application has been dispatched and is in the partner inbox.
                </div>
                <div>
                  <span className="font-bold text-blue-400">Under Review:</span> The officer has opened your passport and is reviewing credentials.
                </div>
                <div>
                  <span className="font-bold text-emerald-400">Approved:</span> Review succeeded. The partner has accepted your digital compliance identity.
                </div>
                <div>
                  <span className="font-bold text-orange-400">Additional Docs Requested:</span> The officer needs supplementary credentials before resolving the application.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
