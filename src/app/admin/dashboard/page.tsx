'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AppContext';
import { useSearchParams } from 'next/navigation';
import {
  Bell,
  Search,
  Sliders,
  Loader2,
  FileText,
  ShieldCheck,
  Building,
  Landmark,
  Bot,
  History,
  LayoutDashboard
} from 'lucide-react';
import { toast } from 'sonner';

// Admin Sub-Views
import AdminOverview from '@/components/admin/AdminOverview';
import AdminQueue from '@/components/admin/AdminQueue';
import AdminReviewModal from '@/components/admin/AdminReviewModal';
import AdminCompanies from '@/components/admin/AdminCompanies';
import AdminInstitutions from '@/components/admin/AdminInstitutions';
import AdminPassports from '@/components/admin/AdminPassports';
import AdminAuditLogs from '@/components/admin/AdminAuditLogs';
import AdminRules from '@/components/admin/AdminRules';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminAIProcessing from '@/components/admin/AdminAIProcessing';

function AdminDashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  // Page States
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [passports, setPassports] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);

  // Selection states
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Global search states
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStatsData(d);
      }

      // Fetch documents (queue)
      const docsRes = await fetch('/api/documents');
      if (docsRes.ok) {
        const d = await docsRes.json();
        setDocuments(d.documents || []);
      }

      // Fetch companies
      const compsRes = await fetch('/api/admin/companies');
      if (compsRes.ok) {
        const d = await compsRes.json();
        setCompanies(d.companies || []);
      }

      // Fetch institutions
      const instRes = await fetch('/api/admin/institutions');
      if (instRes.ok) {
        const d = await instRes.json();
        setInstitutions(d.institutions || []);
      }

      // Fetch passports
      const passRes = await fetch('/api/admin/passports');
      if (passRes.ok) {
        const d = await passRes.json();
        setPassports(d.passports || []);
      }

      // Fetch audit logs
      const logsRes = await fetch('/api/logs');
      if (logsRes.ok) {
        const d = await logsRes.json();
        setLogs(d.logs || []);
      }

      // Fetch rules
      const rulesRes = await fetch('/api/admin/rules');
      if (rulesRes.ok) {
        const d = await rulesRes.json();
        setRules(d.rules || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load administrative console datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchAdminData();
    }
  }, [user]);

  // Handle global search queries
  const handleGlobalSearch = (val: string) => {
    setGlobalQuery(val);
    if (!val.trim()) {
      setSearchResults(null);
      return;
    }

    const q = val.toLowerCase();
    const matchedComps = companies.filter((c) => c.name.toLowerCase().includes(q));
    const matchedPassports = passports.filter((p) => p.passportId.toLowerCase().includes(q));
    const matchedDocs = documents.filter((d) => d.name.toLowerCase().includes(q));

    setSearchResults({
      companies: matchedComps.slice(0, 3),
      passports: matchedPassports.slice(0, 3),
      documents: matchedDocs.slice(0, 3),
    });
  };

  const getBreadcrumbTitle = () => {
    return 'System Overview';
  };

  const renderActiveView = () => {
    if (!statsData) return null;
    switch (activeTab) {
      case 'overview':
        return <AdminOverview stats={statsData.stats} charts={statsData.charts} />;
      case 'queue':
        return (
          <AdminQueue
            documents={documents}
            onActionComplete={fetchAdminData}
            onSelectDoc={setSelectedDoc}
            selectedDocId={selectedDoc?.id}
          />
        );
      case 'companies':
        return <AdminCompanies companies={companies} onActionComplete={fetchAdminData} />;
      case 'institutions':
        return <AdminInstitutions institutions={institutions} onActionComplete={fetchAdminData} />;
      case 'ai':
        return (
          <AdminAIProcessing
            documents={documents}
            onActionComplete={fetchAdminData}
            onSelectDoc={setSelectedDoc}
          />
        );
      case 'passports':
        return <AdminPassports passports={passports} onActionComplete={fetchAdminData} />;
      case 'logs':
        return <AdminAuditLogs logs={logs} />;
      case 'rules':
        return <AdminRules rules={rules} onActionComplete={fetchAdminData} />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminOverview stats={statsData.stats} charts={statsData.charts} />;
    }
  };

  if (loading && !statsData) {
    return (
      <main className="flex-1 p-8 space-y-6 animate-pulse radial-glow">
        <div className="h-8 bg-border/40 w-1/4 rounded-xl" />
        <div className="h-40 bg-border/40 rounded-3xl" />
        <div className="h-64 bg-border/40 rounded-3xl" />
      </main>
    );
  }

  const unreadAlertsCount = documents.filter((d) => d.status === 'UPLOADED' || d.status === 'PROCESSING').length;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Top Navigation */}
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-card/10 backdrop-blur-md z-20 shrink-0">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-muted-foreground">
          <span>Administration</span>
          <span>/</span>
          <span className="text-foreground">{getBreadcrumbTitle()}</span>
        </div>

        {/* Global Search Bar */}
        <div className="flex items-center space-x-4 relative">
          <div className="hidden md:flex bg-zinc-950/40 border border-border rounded-xl p-1.5 items-center gap-1.5 w-64">
            <Search className="h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              placeholder="Search startups, passports..."
              className="bg-transparent text-xs outline-none text-foreground w-full"
            />
          </div>

          {/* Search Result Overlay */}
          {searchResults && (
            <div className="absolute top-12 right-12 w-80 bg-zinc-950 border border-border shadow-2xl rounded-2xl p-4 z-45 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border/30">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Search results</span>
                <button onClick={() => setSearchResults(null)} className="text-[10px] text-muted-foreground">Clear</button>
              </div>

              {/* Companies */}
              {searchResults.companies.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] text-primary uppercase font-bold">Startups</span>
                  {searchResults.companies.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSearchResults(null);
                        setGlobalQuery('');
                        window.location.search = `?tab=companies`;
                      }}
                      className="text-[10px] text-foreground p-1 hover:bg-neutral-800/50 rounded cursor-pointer truncate"
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Passports */}
              {searchResults.passports.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t border-border/10">
                  <span className="text-[9px] text-primary uppercase font-bold">Compliance Passports</span>
                  {searchResults.passports.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSearchResults(null);
                        setGlobalQuery('');
                        window.location.search = `?tab=passports`;
                      }}
                      className="text-[10px] font-mono text-foreground p-1 hover:bg-neutral-800/50 rounded cursor-pointer truncate"
                    >
                      {p.passportId}
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              {searchResults.documents.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t border-border/10">
                  <span className="text-[9px] text-primary uppercase font-bold">Uploaded Documents</span>
                  {searchResults.documents.map((d: any) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSearchResults(null);
                        setGlobalQuery('');
                        setSelectedDoc(d);
                      }}
                      className="text-[10px] text-foreground p-1 hover:bg-neutral-800/50 rounded cursor-pointer truncate"
                    >
                      {d.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Details */}
          <div className="flex items-center space-x-2 border-l border-border/40 pl-3.5">
            <div className="h-7 w-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs uppercase">
              {user?.name?.slice(0, 2) || 'AD'}
            </div>
            <div className="hidden lg:block text-left text-[10px]">
              <span className="font-bold text-foreground block leading-tight">{user?.name}</span>
              <span className="text-zinc-500 font-semibold uppercase leading-none">{user?.role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 relative radial-glow">
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              {renderActiveView()}
            </div>

            {/* Side Review Drawer */}
            <div className="lg:col-span-1">
              {selectedDoc ? (
                <AdminReviewModal
                  document={selectedDoc}
                  onClose={() => setSelectedDoc(null)}
                  onActionComplete={fetchAdminData}
                />
              ) : (
                <div className="bg-card/20 border border-dashed border-border/60 rounded-3xl p-8 text-center space-y-3 text-xs text-muted-foreground">
                  <Sliders className="h-8 w-8 mx-auto text-muted-foreground/30" />
                  <p>Select any document filing or search entry to open the AI-Integrity and Manual Authorizer panel</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
