'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AppContext';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PassportQR from '@/components/PassportQR';
import {
  Search,
  Building,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Sliders,
  Send,
  Calendar,
  Lock,
  ChevronRight,
  Landmark,
  FileCheck,
  Download,
  Info,
  User,
  Phone,
  Mail,
  Award,
  Key,
  Sparkles,
  ArrowRight,
  History,
  Settings as SettingsIcon,
  Bell,
  ShieldAlert,
  CalendarClock
} from 'lucide-react';
import { toast } from 'sonner';

export function InstitutionDashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'dashboard';

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]); // Incoming applications
  const [searching, setSearching] = useState(false);

  // Selected entities
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [viewingPassport, setViewingPassport] = useState<any | null>(null);
  const [viewingSharedRequest, setViewingSharedRequest] = useState<any | null>(null);
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Filters for Search Startups
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [filterPassportStatus, setFilterPassportStatus] = useState('');

  // Settings form states
  const [settingsName, setSettingsName] = useState('HDFC Bank');
  const [settingsType, setSettingsType] = useState('Commercial Bank');
  const [settingsContact, setSettingsContact] = useState('Rajesh Sharma');
  const [settingsEmail, setSettingsEmail] = useState('corporate@hdfc.com');
  const [settingsPhone, setSettingsPhone] = useState('+91 22 6652 0000');
  const [settingsNotifPref, setSettingsNotifPref] = useState({ email: true, push: true });
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  // Additional Document Request form states
  const [additionalDocReqOpen, setAdditionalDocReqOpen] = useState(false);
  const [requestingDocsForReqId, setRequestingDocsForReqId] = useState('');
  const [addDocMessage, setAddDocMessage] = useState('');
  const [addDocPriority, setAddDocPriority] = useState('MEDIUM');
  const [addDocDueDate, setAddDocDueDate] = useState('');
  const [addDocTypes, setAddDocTypes] = useState<string[]>([]);

  const availableDocTypes = [
    'GST Certificate',
    'PAN Card',
    'Certificate of Incorporation (CIN)',
    'Director KYC',
    'Financial Statement',
    'Business License',
    'FSSAI License',
    'Bank Statement',
  ];

  const fetchSentRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setSentRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    if (user && user.role === 'INSTITUTION') {
      fetchSentRequests();
      setSettingsName(user.name || 'HDFC Bank');
      setSettingsEmail(user.email || 'corporate@hdfc.com');
    }
  }, [user]);

  // Log audit logs in database
  const logAuditActivity = async (companyId: string | null, action: string, details: string) => {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, action, details }),
      });
    } catch (err) {
      console.error('Failed to log audit activity:', err);
    }
  };

  // Record Application viewed notification to startup
  useEffect(() => {
    if (activeTab === 'application-details' && selectedRequest) {
      const recordView = async () => {
        try {
          await fetch('/api/requests', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: selectedRequest.id,
              action: 'view',
            }),
          });
        } catch (error) {
          console.error('Error logging application view:', error);
        }
      };
      recordView();
      logAuditActivity(selectedRequest.companyId, 'VIEW', `Reviewed application details for ${selectedRequest.company.name}`);
    }
  }, [activeTab, selectedRequest]);

  // Perform search query (Secondary Search tab)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearching(true);
    try {
      let url = `/api/institution/search?q=${searchQuery}`;
      if (filterIndustry) url += `&industry=${encodeURIComponent(filterIndustry)}`;
      if (filterCountry) url += `&country=${encodeURIComponent(filterCountry)}`;
      if (filterMinScore > 0) url += `&minScore=${filterMinScore}`;
      if (filterPassportStatus) url += `&passportStatus=${filterPassportStatus}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.companies || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Search query failed.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'INSTITUTION' && activeTab === 'search') {
      handleSearch();
    }
  }, [filterIndustry, filterCountry, filterMinScore, filterPassportStatus, activeTab]);

  // Open Company Profile Page (Secondary search item profile)
  const openCompanyProfile = async (comp: any) => {
    setSelectedCompanyId(comp.id);
    setSelectedCompany(comp);
    setSelectedRequest(null);
    setViewingPassport(null);
    router.push('/institution?tab=profile');
    await logAuditActivity(comp.id, 'VIEW', `Viewed startup directory details for: ${comp.name}`);
  };

  // Open Application Details
  const openApplicationDetails = (req: any) => {
    setSelectedRequest(req);
    setSelectedCompany(req.company);
    router.push('/institution?tab=application-details');
  };

  // Open Shared Decrypted documents page
  const openSharedDocuments = async (req: any) => {
    setViewingSharedRequest(req);
    setSharedDocs([]);
    setLoadingDocs(true);
    router.push('/institution?tab=shared-documents');

    try {
      const res = await fetch(`/api/documents?companyId=${req.companyId}`);
      if (res.ok) {
        const data = await res.json();
        const sharedIds: string[] = JSON.parse(req.sharedDocuments || '[]');
        const docs = (data.documents || []).filter((d: any) => sharedIds.includes(d.id));
        setSharedDocs(docs);
        await logAuditActivity(req.companyId, 'VIEW', `Accessed decrypted documents registry for: ${req.company.name}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load shared files');
    } finally {
      setLoadingDocs(false);
    }
  };

  // Status updates (Under Review, Approve, Reject)
  const handleStatusUpdate = async (reqId: string, status: string) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqId,
          status,
        }),
      });

      if (res.ok) {
        toast.success(`Application status updated to ${status.replace('_', ' ')}.`);
        fetchSentRequests();
        if (selectedRequest && selectedRequest.id === reqId) {
          setSelectedRequest((prev: any) => ({ ...prev, status }));
        }
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Status update failed.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not update status');
    }
  };

  // Dispatch Additional Documents Request
  const dispatchAdditionalDocsRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingDocsForReqId) return;

    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: requestingDocsForReqId,
          action: 'request_additional',
          additionalDocsRequest: {
            message: addDocMessage,
            priority: addDocPriority,
            dueDate: addDocDueDate,
            documentTypes: addDocTypes,
          },
        }),
      });

      if (res.ok) {
        toast.success('Requested additional documents successfully.');
        setAdditionalDocReqOpen(false);
        setAddDocMessage('');
        setAddDocPriority('MEDIUM');
        setAddDocDueDate('');
        setAddDocTypes([]);
        fetchSentRequests();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Request failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not dispatch document request');
    }
  };

  const handleDocTypeToggle = (type: string) => {
    setAddDocTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Mock File Actions for bank officers
  const viewPdfFile = async (doc: any) => {
    toast.info(`Opening secure read-only viewer for ${doc.name}`);
    await logAuditActivity(viewingSharedRequest?.companyId || selectedCompany?.id, 'VIEW', `Viewed document scan: ${doc.name}`);
    window.open(doc.url, '_blank');
  };

  const downloadPdfFile = async (doc: any) => {
    toast.success(`Secure download initiated for ${doc.name}`);
    await logAuditActivity(viewingSharedRequest?.companyId || selectedCompany?.id, 'SHARE', `Downloaded document scan: ${doc.name}`);
    const link = document.createElement('a');
    link.href = doc.url;
    link.setAttribute('download', doc.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPassportPdf = async (compName: string, passportId: string) => {
    toast.success(`Downloading verified Passport PDF for ${compName}`);
    await logAuditActivity(selectedCompanyId || (selectedRequest && selectedRequest.companyId), 'SHARE', `Downloaded Compliance Passport certificate PDF for ${compName}`);
  };

  const downloadAllSharedDocs = () => {
    toast.success(`Downloading all shared documents for ${selectedCompany?.name || 'startup'}`);
    logAuditActivity(selectedCompany?.id, 'SHARE', `Downloaded bundle of all shared documents for: ${selectedCompany?.name}`);
  };

  // Parse compliance identifiers dynamically from OCR records
  const getCompanyIdentifier = (type: 'PAN' | 'GST' | 'CIN') => {
    if (!selectedCompany?.documents) return 'Not Available';
    const match = selectedCompany.documents.find((d: any) => {
      const t = d.type.toUpperCase();
      if (type === 'PAN') return t.includes('PAN');
      if (type === 'GST') return t.includes('GST');
      if (type === 'CIN') return t.includes('INCORPORATION') || t.includes('COI');
      return false;
    });
    if (!match) return 'Not Available';
    try {
      const data = JSON.parse(match.ocrData || '{}');
      if (type === 'PAN') return data.pan || data.panNumber || 'Available (Signed)';
      if (type === 'GST') return data.gstin || data.gstNumber || 'Available (Signed)';
      if (type === 'CIN') return data.cin || data.cinNumber || 'Available (Signed)';
    } catch(e) {}
    return 'Available';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center shrink-0">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Submitted
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center shrink-0">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center shrink-0">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center shrink-0">
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Rejected
          </span>
        );
      case 'ADDITIONAL_DOCUMENTS_REQUESTED':
        return (
          <span className="bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center shrink-0 animate-pulse">
            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
            Info Requested
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center shrink-0">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Completed
          </span>
        );
      default:
        return (
          <span className="bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center shrink-0">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {status}
          </span>
        );
    }
  };

  const getDocumentStatusBadge = (status: string, sizeClass: string = 'text-[9px]') => {
    const s = (status || '').toLowerCase();
    if (s === 'verified' || s === 'approved' || s === 'ai_validated') {
      return (
        <span className={`bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 ${sizeClass} font-bold px-2 py-0.5 rounded shrink-0`}>
          {status}
        </span>
      );
    } else if (s === 'verification failed' || s === 'failed' || s === 'rejected') {
      return (
        <span className={`bg-rose-500/10 border border-rose-500/20 text-rose-400 ${sizeClass} font-bold px-2 py-0.5 rounded shrink-0`}>
          {status}
        </span>
      );
    } else if (s === 'low confidence' || s === 'under review') {
      return (
        <span className={`bg-amber-500/10 border border-amber-500/20 text-amber-400 ${sizeClass} font-bold px-2 py-0.5 rounded shrink-0`}>
          {status}
        </span>
      );
    } else {
      return (
        <span className={`bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 ${sizeClass} font-bold px-2 py-0.5 rounded shrink-0`}>
          {status}
        </span>
      );
    }
  };

  // Render QR Code verification using the PassportQR component
  const getPassportQRProps = (req: any) => {
    if (!req || !req.company) return null;
    const comp = req.company;
    const passport = comp.passport || {};
    return {
      passportId: passport.passportId || 'N/A',
      companyName: comp.name,
      regNumber: comp.regNumber,
      complianceScore: comp.complianceScore,
      status: passport.status || 'UNTRUSTED',
      digitalSignature: passport.digitalSignature || 'N/A',
      generatedAt: passport.generatedAt || new Date().toISOString(),
      expiresAt: passport.expiresAt || new Date().toISOString(),
      verifiedDocs: comp.documents
        ?.filter((d: any) => d.status === 'VERIFIED' || d.status === 'AI_VALIDATED' || d.status === 'Verified')
        .map((d: any) => d.type) || [],
    };
  };

  // Analytics Metrics
  const totalApps = sentRequests.length;
  const underReviewApps = sentRequests.filter(r => r.status === 'UNDER_REVIEW').length;
  const approvedApps = sentRequests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length;
  const rejectedApps = sentRequests.filter(r => r.status === 'REJECTED').length;
  const avgScore = totalApps > 0 
    ? Math.round(sentRequests.reduce((sum, r) => sum + r.company.complianceScore, 0) / totalApps) 
    : 0;

  // Industries Distribution calculation
  const industryDistribution: Record<string, number> = {};
  sentRequests.forEach(r => {
    const ind = r.company.industry || 'General Industry';
    industryDistribution[ind] = (industryDistribution[ind] || 0) + 1;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative radial-glow">
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-border/20 pb-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center">
                <Landmark className="h-7 w-7 text-primary mr-2.5" />
                Bank Officer Portal
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Review verified startup compliance portfolios, underwriting credentials, and live applications.
              </p>
            </div>
            
            <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2 flex items-center space-x-2 text-xs">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              <span className="font-bold text-foreground">{settingsName}</span>
            </div>
          </div>

          {/* ==================================================== */}
          {/* TAB 1: APPLICATIONS RECEIVED (Landing Page)           */}
          {/* ==================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card/40 border border-border/40 rounded-3xl p-6">
                <h3 className="text-base font-bold text-foreground">Applications Received</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verify reusable compliance passports shared voluntarily by startups.
                </p>
              </div>

              {sentRequests.length === 0 ? (
                <div className="bg-card/10 border border-border/20 rounded-3xl p-12 text-center text-xs text-muted-foreground">
                  No applications received yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sentRequests.map((req) => {
                    const passport = req.company.passport || {
                      status: 'UNTRUSTED',
                    };
                    const sharedDocIds = JSON.parse(req.sharedDocuments || '[]');
                    const sharedDocTypes = req.company.documents
                      ?.filter((d: any) => sharedDocIds.includes(d.id))
                      .map((d: any) => d.type) || [];

                    return (
                      <div
                        key={req.id}
                        className="bg-card/30 border border-border/30 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/45 transition-colors"
                      >
                        <div className="space-y-4 flex-1 min-w-0">
                          <div className="flex items-start space-x-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-border/50 flex items-center justify-center shrink-0">
                              <Building className="h-6 w-6 text-primary" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center space-x-2.5">
                                <h4 className="text-base font-extrabold text-foreground truncate">{req.company.name}</h4>
                                <span className="text-[9.5px] font-mono text-zinc-500">ID: {req.id.slice(0, 8)}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] bg-zinc-950/40 border border-border/20 px-2 py-0.5 rounded-full font-semibold text-muted-foreground">
                                  Purpose: {req.purpose || 'Compliance Review'}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium">
                                  Applied on: {new Date(req.requestedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-950/20 p-4 rounded-2xl border border-border/10 text-xs">
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase font-semibold">Compliance score</span>
                              <p className="font-bold text-indigo-400 text-sm mt-0.5">{req.company.complianceScore}%</p>
                            </div>
                            <div className="col-span-3">
                              <span className="text-[9px] text-zinc-500 uppercase font-semibold">Shared Documents ({sharedDocIds.length})</span>
                              <p className="font-semibold text-foreground mt-0.5 truncate">
                                {sharedDocTypes.join(', ') || 'Passport Summary Only'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions column */}
                        <div className="flex flex-col gap-2 shrink-0 md:w-56 border-t md:border-t-0 md:border-l border-border/25 pt-4 md:pt-0 md:pl-6 justify-center">
                          <div className="flex items-center justify-between pb-1 text-xs">
                            <span className="text-zinc-500">App Status:</span>
                            {getStatusBadge(req.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => openApplicationDetails(req)}
                              className="px-3 h-8 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all flex items-center justify-center"
                            >
                              View Application
                            </button>
                            <button
                              onClick={() => openApplicationDetails(req)}
                              className="px-3 h-8 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all flex items-center justify-center"
                            >
                              Open Passport
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => openSharedDocuments(req)}
                              className="w-full h-8 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all flex items-center justify-center"
                            >
                              View Documents
                            </button>
                            <button
                              onClick={() => openApplicationDetails(req)}
                              className="w-full h-8 text-[10px] font-bold text-primary hover:bg-primary/10 border border-primary/20 rounded-xl transition-all flex items-center justify-center"
                            >
                              Continue Review
                            </button>
                          </div>

                          <div className="flex gap-2 pt-1.5">
                            <button
                              onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                              className="flex-1 h-8 text-[10px] font-bold text-primary-foreground bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center justify-center"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                              className="flex-1 h-8 text-[10px] font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl transition-all flex items-center justify-center"
                            >
                              Reject
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1.5">
                            <button
                              onClick={() => handleStatusUpdate(req.id, 'UNDER_REVIEW')}
                              className="w-full h-8 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all"
                            >
                              Mark Under Review
                            </button>
                            <button
                              onClick={() => {
                                setRequestingDocsForReqId(req.id);
                                setAdditionalDocReqOpen(true);
                              }}
                              className="w-full h-8 text-[10px] font-bold text-amber-500 hover:bg-amber-500/10 border border-amber-500/20 rounded-xl transition-all"
                            >
                              Request Info
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: SECONDARY SEARCH STARTUPS                     */}
          {/* ==================================================== */}
          {activeTab === 'search' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Filter controls */}
              <div className="bg-card/30 border border-border/30 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center">
                  <Sliders className="h-4 w-4 text-primary mr-2" />
                  Search Historical Startups & Passport IDs
                </h3>

                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by company name, registration number (CIN), GSTIN, or passport ID..."
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 pl-9 pr-3 py-2.5 outline-none focus:border-primary text-foreground font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
                  >
                    Apply Search
                  </button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Industry</label>
                    <select
                      value={filterIndustry}
                      onChange={(e) => setFilterIndustry(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/50 p-2 text-foreground"
                    >
                      <option value="">All Industries</option>
                      <option value="SaaS / AI Tools">SaaS / AI Tools</option>
                      <option value="FoodTech / E-Commerce">FoodTech / E-Commerce</option>
                      <option value="Fintech / Payments">Fintech / Payments</option>
                      <option value="Robotics / Automation">Robotics / Automation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Country</label>
                    <select
                      value={filterCountry}
                      onChange={(e) => setFilterCountry(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/50 p-2 text-foreground"
                    >
                      <option value="">All Countries</option>
                      <option value="India">India</option>
                      <option value="Singapore">Singapore</option>
                      <option value="USA">USA</option>
                    </select>
                  </div>



                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Min Score ({filterMinScore}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filterMinScore}
                      onChange={(e) => setFilterMinScore(parseInt(e.target.value))}
                      className="w-full accent-primary mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Search Result Startup Cards */}
              {searching ? (
                <div className="text-center py-12 text-xs text-muted-foreground animate-pulse">
                  Querying verification records...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="bg-card/10 border border-border/20 rounded-3xl p-12 text-center text-xs text-muted-foreground">
                  No registered companies matched your parameters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((comp) => {
                    const hasApplication = sentRequests.find((r) => r.companyId === comp.id);
                    return (
                      <div
                        key={comp.id}
                        className="bg-card/30 border border-border/30 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-primary/45 transition-colors"
                      >
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-extrabold text-foreground">{comp.name}</h4>
                              <span className="text-[10px] font-medium text-muted-foreground bg-zinc-950/20 px-2 py-0.5 rounded-full border border-border/20">
                                {comp.industry || 'General Industry'}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-muted-foreground">
                              {comp.country || 'Global'}
                            </span>
                          </div>

                          <div className="bg-zinc-950/30 p-3 rounded-2xl border border-border/10 text-xs flex justify-between items-center">
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase font-semibold">Compliance score</span>
                              <p className="font-bold text-indigo-400 text-sm mt-0.5">{comp.complianceScore}%</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                          <button
                            onClick={() => openCompanyProfile(comp)}
                            className="flex-1 px-3 py-2 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all"
                          >
                            View Directory Info
                          </button>

                          {hasApplication ? (
                            <button
                              onClick={() => openApplicationDetails(hasApplication)}
                              className="flex-1 px-3 py-2 text-[10px] font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all"
                            >
                              Open Application
                            </button>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic flex-1 text-center font-medium">
                              No active application
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: APPLICATION DETAILS (The detail review page)  */}
          {/* ==================================================== */}
          {activeTab === 'application-details' && selectedRequest && selectedCompany && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Back link */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => router.push('/institution?tab=dashboard')}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center transition-colors"
                >
                  &larr; Back to Applications Inbox
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-500">Current Status:</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Column: Dossier info, Passport, and Verification Lists */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Company Info section */}
                  <div className="bg-card/40 border border-border/40 rounded-3xl p-6 md:p-8 space-y-6">
                    <div className="flex items-start justify-between border-b border-border/20 pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-primary">Company Profile</span>
                        <h2 className="text-xl font-extrabold text-foreground">{selectedCompany.name}</h2>
                        <p className="text-xs text-muted-foreground">Registry ID / Registration: {selectedCompany.regNumber}</p>
                      </div>
                      
                      <div className="h-14 w-14 rounded-2xl bg-zinc-950/40 border border-border flex items-center justify-center">
                        <Building className="h-7 w-7 text-primary" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-zinc-950/20 border border-border/10 p-3.5 rounded-2xl">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">Industry</span>
                        <p className="font-bold text-foreground mt-0.5">{selectedCompany.industry || 'Technology SaaS'}</p>
                      </div>
                      <div className="bg-zinc-950/20 border border-border/10 p-3.5 rounded-2xl">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">Incorporated in</span>
                        <p className="font-bold text-foreground mt-0.5">{selectedCompany.country || 'India'}</p>
                      </div>
                      <div className="bg-zinc-950/20 border border-border/10 p-3.5 rounded-2xl">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">Verification Method</span>
                        <p className="font-bold text-foreground mt-0.5">AI-Powered OCR & Validation</p>
                      </div>
                      <div className="bg-zinc-950/20 border border-border/10 p-3.5 rounded-2xl">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">GSTIN</span>
                        <p className="font-bold text-foreground mt-0.5 font-mono">{getCompanyIdentifier('GST')}</p>
                      </div>
                      <div className="bg-zinc-950/20 border border-border/10 p-3.5 rounded-2xl">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">PAN</span>
                        <p className="font-bold text-foreground mt-0.5 font-mono">{getCompanyIdentifier('PAN')}</p>
                      </div>
                      <div className="bg-zinc-950/20 border border-border/10 p-3.5 rounded-2xl">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">CIN</span>
                        <p className="font-bold text-foreground mt-0.5 font-mono">{getCompanyIdentifier('CIN')}</p>
                      </div>
                    </div>

                    {selectedRequest.additionalNotes && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Startup Application Notes</span>
                        <p className="bg-zinc-950/30 border border-border/20 p-4 rounded-2xl text-xs text-muted-foreground leading-relaxed font-mono">
                          {selectedRequest.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Documents Ledger: Verified vs Shared Documents */}
                  <div className="bg-card/40 border border-border/40 rounded-3xl p-6 md:p-8 space-y-6">
                    <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center border-b border-border/20 pb-4">
                      <FileCheck className="h-4.5 w-4.5 text-primary mr-2" />
                      Dossier Verification Ledger
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-400 mb-2.5">Shared Application Attachments</h4>
                        
                        {JSON.parse(selectedRequest.sharedDocuments || '[]').length === 0 ? (
                          <p className="text-xs text-muted-foreground italic bg-zinc-950/20 p-4 rounded-2xl text-center">
                            No document scans shared. Startup only shared basic compliance passport details.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-3.5">
                            {selectedCompany.documents
                              ?.filter((d: any) => JSON.parse(selectedRequest.sharedDocuments || '[]').includes(d.id))
                              .map((doc: any) => {
                                let issueDate = 'N/A';
                                try {
                                  const parsed = JSON.parse(doc.ocrData || '{}');
                                  issueDate = parsed.dateOfIncorporation || parsed.dateOfLiability || parsed.incorporationDate || 'N/A';
                                } catch(e) {}
                                
                                return (
                                  <div key={doc.id} className="bg-zinc-950/20 border border-border/15 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="min-w-0 space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[9px] uppercase font-mono font-bold text-zinc-400">{doc.type}</span>
                                        {getDocumentStatusBadge(doc.status)}
                                      </div>
                                      <p className="text-xs font-bold truncate text-foreground">{doc.name}</p>
                                      <p className="text-[9.5px] text-zinc-500">
                                        Issue Date: <span className="font-semibold text-foreground">{issueDate}</span> • Expiry: <span className="font-semibold text-foreground">{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}</span>
                                      </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0 self-end md:self-auto">
                                      <button
                                        onClick={() => viewPdfFile(doc)}
                                        className="h-8 px-3 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-colors"
                                      >
                                        View PDF
                                      </button>
                                      <button
                                        onClick={() => downloadPdfFile(doc)}
                                        className="h-8 px-3 text-[10px] font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-colors"
                                      >
                                        Download PDF
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-border/20">
                        <h4 className="text-xs font-bold text-zinc-400 mb-3">Verification History & Logs</h4>
                        <div className="border-l-2 border-border/30 pl-4 ml-1 space-y-4 text-xs">
                          <div className="relative">
                            <div className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                            <p className="font-bold text-foreground">AI Automated Verification Seal</p>
                            <p className="text-[10px] text-muted-foreground">Certified on dynamic upload by GCP Engine</p>
                          </div>
                          <div className="relative">
                            <div className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-indigo-500" />
                            <p className="font-bold text-foreground">Compliance Passport Generated & Signed</p>
                            <p className="text-[10px] text-muted-foreground">Authority Signature SHA256 validated</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Passport Rendering & Decision Underwriting Actions */}
                <div className="space-y-6">
                  
                  {/* Underwriting decisions */}
                  <div className="bg-card/45 border border-border/40 rounded-3xl p-6 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/20 pb-3">
                      Underwriting & Decisions
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Verify the passport and resolve this application. The startup is notified immediately.
                    </p>

                    <div className="space-y-2 pt-1.5">
                      <button
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'APPROVED')}
                        className="w-full inline-flex items-center justify-center h-10 text-xs font-bold text-primary-foreground bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm"
                      >
                        Approve Application
                      </button>
                      
                      <button
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'UNDER_REVIEW')}
                        className="w-full inline-flex items-center justify-center h-10 text-xs font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all"
                      >
                        Mark Under Review
                      </button>

                      <button
                        onClick={() => {
                          setRequestingDocsForReqId(selectedRequest.id);
                          setAdditionalDocReqOpen(true);
                        }}
                        className="w-full inline-flex items-center justify-center h-10 text-xs font-bold text-amber-500 hover:bg-amber-500/10 border border-amber-500/20 rounded-xl transition-all"
                      >
                        Request Additional Documents
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(selectedRequest.id, 'REJECTED')}
                        className="w-full inline-flex items-center justify-center h-10 text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl transition-all"
                      >
                        Reject Application
                      </button>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border/10">
                      <button
                        onClick={() => downloadPassportPdf(selectedCompany.name, selectedCompany.passport?.passportId || 'N/A')}
                        className="flex-1 h-9 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all flex items-center justify-center"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Passport PDF
                      </button>
                      <button
                        onClick={downloadAllSharedDocs}
                        className="flex-1 h-9 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all flex items-center justify-center"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        All Attachments
                      </button>
                    </div>
                  </div>

                  {/* Reusable Passport component view */}
                  {selectedRequest.sharePassport && getPassportQRProps(selectedRequest) ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Compliance Passport</h4>
                      <div className="scale-[0.9] origin-top bg-zinc-950/40 border border-border/40 rounded-3xl p-1">
                        <PassportQR passport={getPassportQRProps(selectedRequest) as any} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-950/10 border border-rose-500/20 p-5 rounded-3xl text-center space-y-2 text-xs">
                      <ShieldAlert className="h-8 w-8 text-rose-400 mx-auto" />
                      <p className="font-bold text-foreground">Compliance Passport Withheld</p>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        Startup opted not to disclose their compliance passport summary certificate, only shared documents are viewable.
                      </p>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: DIRECTORY PROFILE VIEW                        */}
          {/* ==================================================== */}
          {activeTab === 'profile' && selectedCompany && (
            <div className="bg-card/30 border border-border/30 rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-start border-b border-border/30 pb-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-foreground">{selectedCompany.name}</h2>
                  <p className="text-xs text-muted-foreground font-mono">Registry ID: {selectedCompany.regNumber}</p>
                </div>
                <button
                  onClick={() => router.push('/institution?tab=search')}
                  className="text-xs text-muted-foreground hover:text-foreground font-bold"
                >
                  &larr; Back to Directory
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Details Card */}
                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/20 border border-border/20 p-4 rounded-2xl">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Industry Scope</span>
                      <p className="text-xs font-bold text-foreground mt-1">{selectedCompany.industry || 'Technology Services'}</p>
                    </div>
                    <div className="bg-zinc-950/20 border border-border/20 p-4 rounded-2xl">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Incorporation Country</span>
                      <p className="text-xs font-bold text-foreground mt-1">{selectedCompany.country || 'India'}</p>
                    </div>
                    <div className="bg-zinc-950/20 border border-border/20 p-4 rounded-2xl col-span-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Compliance Rating</span>
                      <p className="text-xs font-extrabold text-indigo-400 mt-1">{selectedCompany.complianceScore}% Score</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/10 border border-border/20 rounded-2xl p-4 space-y-3 text-xs">
                    <h4 className="font-bold text-foreground">Verification Metrics</h4>
                    <div className="flex justify-between border-b border-border/10 pb-2">
                      <span className="text-muted-foreground">Verified Registry Documents</span>
                      <span className="text-foreground font-bold">Verified (COI, PAN, GST)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-zinc-950/20 border border-border/20 p-5 rounded-3xl h-fit text-xs">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/20">
                    Compliance Verification Info
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    This company profile represents a registered startup in the Compliance Passport Directory. Startups can apply directly to your institution and securely share their certified documents.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: REQUEST HISTORY (Consented Vaults)            */}
          {/* ==================================================== */}
          {activeTab === 'requests' && (
            <div className="bg-card/30 border border-border/30 rounded-3xl p-6 space-y-4 animate-in fade-in duration-300">
              <h3 className="text-base font-bold text-foreground flex items-center">
                <History className="h-4.5 w-4.5 mr-2 text-primary" />
                Underwritten Applications Directory
              </h3>

              {sentRequests.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">
                  No underwritten applications history found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/30 text-zinc-500 uppercase text-[9px] font-bold">
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Purpose</th>
                        <th className="py-3 px-4">Shared Docs</th>
                        <th className="py-3 px-4">Submission Date</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {sentRequests.map((req) => {
                        const sharedIds: string[] = JSON.parse(req.sharedDocuments || '[]');
                        return (
                          <tr key={req.id} className="hover:bg-zinc-950/10">
                            <td className="py-3.5 px-4 font-bold text-foreground">{req.company.name}</td>
                            <td className="py-3.5 px-4 text-muted-foreground max-w-[150px] truncate">{req.purpose || 'Due Diligence'}</td>
                            <td className="py-3.5 px-4 text-muted-foreground font-mono text-[10px]">
                              {JSON.parse(req.documentTypes).join(', ')}
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground">
                              {new Date(req.requestedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex justify-center">{getStatusBadge(req.status)}</div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => openApplicationDetails(req)}
                                className="px-2.5 py-1 text-[10px] font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-lg transition-all"
                              >
                                Review Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: SHARED PASSPORTS (Trusted vault)             */}
          {/* ==================================================== */}
          {activeTab === 'passports' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card/30 border border-border/30 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground">Consented Compliance Passports</h3>
                <p className="text-xs text-muted-foreground">
                  Below are the digital compliance passports currently shared with your bank/VC account.
                </p>
              </div>

              {sentRequests.filter(r => r.sharePassport).length === 0 ? (
                <div className="bg-card/10 border border-border/20 rounded-3xl p-12 text-center text-xs text-muted-foreground">
                  No active shared compliance passports yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sentRequests.filter(r => r.sharePassport).map((req) => {
                    const passport = req.company.passport || {
                      passportId: `GCP-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                      complianceScore: req.company.complianceScore,
                      status: req.company.complianceScore >= 80 ? 'TRUSTED' : 'UNTRUSTED',
                      expiresAt: new Date(new Date().getFullYear() + 1, 0, 1),
                    };

                    return (
                      <div
                        key={req.id}
                        className="bg-card/30 border border-border/30 rounded-3xl p-6 space-y-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-bold text-zinc-500 font-mono">{passport.passportId}</h4>
                              <p className="text-sm font-extrabold text-foreground mt-0.5">{req.company.name}</p>
                            </div>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                              ACTIVE
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/20 p-3 rounded-2xl border border-border/10">
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase font-semibold">Compliance score</span>
                              <p className="font-bold text-foreground">{passport.complianceScore}%</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase font-semibold">Expiration</span>
                              <p className="font-bold text-foreground font-mono">{new Date(passport.expiresAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                          <button
                            onClick={() => openApplicationDetails(req)}
                            className="flex-1 px-3 py-2 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all"
                          >
                            View Passport
                          </button>
                          
                          <button
                            onClick={() => downloadPassportPdf(req.company.name, passport.passportId)}
                            className="p-2 hover:text-primary hover:bg-primary/10 border border-border/40 rounded-xl text-muted-foreground transition-all"
                            title="Download PDF"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </button>

                          <button
                            onClick={() => openSharedDocuments(req)}
                            className="px-3 py-2 text-[10px] font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
                          >
                            View Documents
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: SHARED DOCUMENTS                             */}
          {/* ==================================================== */}
          {activeTab === 'shared-documents' && viewingSharedRequest && (
            <div className="bg-card/30 border border-border/30 rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-border/30 pb-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Consented Document Decrypted Vault</h3>
                  <p className="text-xs text-muted-foreground">
                    Authorized files from: <span className="font-bold text-foreground">{viewingSharedRequest.company.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => router.push('/institution?tab=dashboard')}
                  className="text-xs text-muted-foreground hover:text-foreground font-bold"
                >
                  &larr; Back to Dashboard
                </button>
              </div>

              {loadingDocs ? (
                <div className="text-center py-12 text-xs text-muted-foreground animate-pulse">
                  Decrypting audit records and checking hashes...
                </div>
              ) : sharedDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-12">
                  No files have been selected or approved for this vault.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sharedDocs.map((doc) => (
                    <div key={doc.id} className="bg-zinc-950/20 border border-border/20 p-5 rounded-3xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-500 font-mono">{doc.type}</h4>
                          <p className="text-sm font-extrabold text-foreground mt-0.5 truncate max-w-[200px]">{doc.name}</p>
                        </div>
                        {getDocumentStatusBadge(doc.status, 'text-[10px]')}
                      </div>

                      <div className="space-y-2 text-xs border-t border-border/10 pt-3">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold block">AI OCR Structured Records</span>
                        <div className="grid grid-cols-2 gap-1.5 bg-black/20 p-3 rounded-2xl text-[10px] font-mono text-zinc-400">
                          {Object.entries(JSON.parse(doc.ocrData || '{}')).map(([k, v]) => (
                            <div key={k} className="col-span-2 flex justify-between border-b border-white/5 pb-0.5">
                              <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="text-foreground font-semibold truncate max-w-[160px]">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                        <button
                          onClick={() => viewPdfFile(doc)}
                          className="flex-1 px-3 py-2 text-[10px] font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all"
                        >
                          View PDF Scan
                        </button>
                        <button
                          onClick={() => downloadPdfFile(doc)}
                          className="flex-1 px-3 py-2 text-[10px] font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
                        >
                          Download Scan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 8: ANALYTICS                                    */}
          {/* ==================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card/30 border border-border/30 rounded-3xl p-6 space-y-2">
                <h3 className="text-base font-bold text-foreground">Compliance Requests Analytics</h3>
                <p className="text-xs text-muted-foreground">
                  Monitor underwriting queues, approved application margins, and company distribution rates.
                </p>
              </div>

              {/* Stats Breakdown */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card/30 border border-border/30 rounded-3xl p-5 space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Applications</span>
                  <p className="text-3xl font-extrabold text-foreground">{totalApps}</p>
                </div>
                <div className="bg-card/30 border border-border/30 rounded-3xl p-5 space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Under Review</span>
                  <p className="text-3xl font-extrabold text-indigo-400">{underReviewApps}</p>
                </div>
                <div className="bg-card/30 border border-border/30 rounded-3xl p-5 space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Approved</span>
                  <p className="text-3xl font-extrabold text-emerald-400">{approvedApps}</p>
                </div>
                <div className="bg-card/30 border border-border/30 rounded-3xl p-5 space-y-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Rejected</span>
                  <p className="text-3xl font-extrabold text-rose-500">{rejectedApps}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card/30 border border-border/30 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Metrics Snapshot</h4>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-border/10 pb-2">
                      <span className="text-muted-foreground">Average Compliance Score</span>
                      <span className="text-foreground font-bold">{avgScore}%</span>
                    </div>
                    <div className="flex justify-between border-b border-border/10 pb-2">
                      <span className="text-muted-foreground">Average Processing Time</span>
                      <span className="text-foreground font-bold">1.8 business days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Most Requested Document</span>
                      <span className="text-foreground font-bold">GST Certificate (91% Share)</span>
                    </div>
                  </div>
                </div>

                {/* Country distribution */}
                <div className="bg-card/30 border border-border/30 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Top Industries</h4>
                  <div className="space-y-3.5 text-xs">
                    {Object.entries(industryDistribution).map(([ind, count]) => (
                      <div key={ind} className="flex justify-between border-b border-border/10 pb-2">
                        <span className="text-muted-foreground">{ind}</span>
                        <span className="text-foreground font-bold">{count} Applications</span>
                      </div>
                    ))}
                    {Object.keys(industryDistribution).length === 0 && (
                      <span className="text-zinc-500 italic">No industry details indexed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 9: SETTINGS                                     */}
          {/* ==================================================== */}
          {activeTab === 'settings' && (
            <div className="bg-card/30 border border-border/30 rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
              <h3 className="text-base font-bold text-foreground">Institution Portal Settings</h3>
              
              <form onSubmit={(e) => { e.preventDefault(); toast.success('Profile configurations saved!'); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Institution Name</label>
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Institution Type</label>
                    <select
                      value={settingsType}
                      onChange={(e) => setSettingsType(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 text-foreground"
                    >
                      <option value="Commercial Bank">Commercial Bank</option>
                      <option value="Venture Capital Fund">Venture Capital Fund</option>
                      <option value="Payment Gateway">Payment Gateway</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Contact Officer</label>
                    <input
                      type="text"
                      value={settingsContact}
                      onChange={(e) => setSettingsContact(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Email</label>
                    <input
                      type="email"
                      value={settingsEmail}
                      onChange={(e) => setSettingsEmail(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Phone</label>
                    <input
                      type="text"
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Dark Mode Preference</label>
                    <button
                      type="button"
                      onClick={() => setDarkMode(!darkMode)}
                      className="w-full text-xs h-10 mt-1 rounded-xl border border-border bg-zinc-950/40 text-foreground font-bold flex items-center justify-center hover:bg-zinc-900"
                    >
                      {darkMode ? 'Enabled (Dark)' : 'Disabled (Light)'}
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">New Password</label>
                    <input
                      type="password"
                      value={settingsPassword}
                      onChange={(e) => setSettingsPassword(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={settingsConfirmPassword}
                      onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                      className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/20">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Notification Preferences</h4>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settingsNotifPref.email}
                        onChange={(e) => setSettingsNotifPref({ ...settingsNotifPref, email: e.target.checked })}
                        className="accent-primary"
                      />
                      <span>Receive email alerts when startup responds to additional document requests.</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
                >
                  Save Settings
                </button>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* REQUEST ADDITIONAL DOCUMENTS DIALOG OVERLAY          */}
          {/* ==================================================== */}
          {additionalDocReqOpen && requestingDocsForReqId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form
                onSubmit={dispatchAdditionalDocsRequest}
                className="bg-zinc-950 border border-primary/30 max-w-md w-full rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex justify-between items-center pb-2 border-b border-border/40">
                  <h3 className="text-sm font-bold text-foreground">Request Additional Documents</h3>
                  <button
                    type="button"
                    onClick={() => setAdditionalDocReqOpen(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Select additional types */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block">Select Document Categories</label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {availableDocTypes.map((type) => {
                        const isSelected = addDocTypes.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleDocTypeToggle(type)}
                            className={`p-2 rounded-xl text-[10px] font-bold border text-left transition-colors truncate ${
                              isSelected
                                ? 'bg-primary/10 border-primary/50 text-foreground'
                                : 'bg-transparent border-border/40 text-muted-foreground'
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Priority</label>
                      <select
                        value={addDocPriority}
                        onChange={(e) => setAddDocPriority(e.target.value)}
                        className="w-full text-xs rounded-xl border border-border bg-zinc-900/50 p-2 text-foreground outline-none"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">Due Date</label>
                      <input
                        type="date"
                        value={addDocDueDate}
                        onChange={(e) => setAddDocDueDate(e.target.value)}
                        required
                        className="w-full text-xs rounded-xl border border-border bg-zinc-900/50 p-1.5 text-foreground outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block">Instruction Message</label>
                    <textarea
                      value={addDocMessage}
                      onChange={(e) => setAddDocMessage(e.target.value)}
                      placeholder="Explain to the startup which extra documents (like audit reports, utility proof) you need..."
                      rows={3}
                      required
                      className="w-full text-xs rounded-xl border border-border bg-zinc-900/50 p-2.5 text-foreground outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center px-4 h-10 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function InstitutionDashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background text-xs text-muted-foreground">
        Loading verification portal data...
      </div>
    }>
      <InstitutionDashboardContent />
    </Suspense>
  );
}
