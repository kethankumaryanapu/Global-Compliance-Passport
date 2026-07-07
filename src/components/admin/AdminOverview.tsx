'use client';

import { ShieldCheck, Landmark, FileText, CheckCircle, Clock, AlertTriangle, Sparkles, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface AdminOverviewProps {
  stats: {
    totalCompanies: number;
    verifiedCompanies: number;
    pendingVerification: number;
    rejectedDocuments: number;
    totalInstitutions: number;
    passportsIssued: number;
    uploadedToday: number;
    expiringSoon: number;
    avgComplianceScore: number;
    avgAiConfidence: number;
  };
  charts: {
    docTypeDistribution: any[];
    monthlyRegistrations: any[];
    dailyUploads: any[];
  };
}

export default function AdminOverview({ stats, charts }: AdminOverviewProps) {
  const kpis = [
    { title: 'Registered Startups', value: stats.totalCompanies, subtext: 'Total companies onboarding', icon: ShieldCheck, color: 'text-indigo-400' },
    { title: 'Passports Issued', value: stats.passportsIssued, subtext: 'Trusted active credentials', icon: FileCheckIndicator, color: 'text-emerald-400' },
    { title: 'Pending Review', value: stats.pendingVerification, subtext: 'Document verifications queue', icon: Clock, color: 'text-amber-400' },
    { title: 'Expiring Soon', value: stats.expiringSoon, subtext: 'Renewals within 90 days', icon: AlertTriangle, color: stats.expiringSoon > 0 ? 'text-rose-400 animate-pulse' : 'text-zinc-500' },
    { title: 'Partner Institutions', value: stats.totalInstitutions, subtext: 'Banks, VCs and Gateways', icon: Landmark, color: 'text-purple-400' },
    { title: 'Average Compliance', value: `${stats.avgComplianceScore}%`, subtext: 'Standard score average', icon: Activity, color: 'text-sky-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Upper badge */}
      <div className="bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-2xl flex items-center space-x-3 w-fit text-xs font-semibold text-primary">
        <Sparkles className="h-4 w-4" />
        <span>TCA Authority Console Online — Auditing Reusable Corporate Passports</span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-card/40 border border-border/40 rounded-3xl p-6 relative overflow-hidden transition-all hover:border-primary/30"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <p className="text-3xl font-extrabold text-foreground tracking-tight">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-zinc-900/40 border border-border/40 ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{kpi.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Chart */}
        <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Startup Growth</h3>
            <p className="text-[10px] text-muted-foreground">Monthly onboarding index</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRegistrations} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="regGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="companies" stroke="#6366f1" strokeWidth={2} fill="url(#regGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uploads Chart */}
        <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Document Activity</h3>
            <p className="text-[10px] text-muted-foreground">Daily upload logs</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.dailyUploads} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="uploads" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// Temporary icon definition to prevent circular reference or compile error
function FileCheckIndicator(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}
