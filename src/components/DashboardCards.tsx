'use client';

import { ShieldCheck, FileText, CheckCircle2, Clock, XCircle, AlertTriangle, Share2, Award } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<any>;
  trendColor?: string;
  progress?: number;
}

export function MetricCard({ title, value, subtext, icon: Icon, trendColor = 'text-primary', progress }: MetricCardProps) {
  return (
    <div className="bg-card/40 border border-border/40 rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-extrabold tracking-tight text-foreground mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-2xl bg-zinc-900/40 border border-border/40 ${trendColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{subtext}</span>
        {progress !== undefined && (
          <span className="text-[10px] font-bold text-foreground">{progress}%</span>
        )}
      </div>

      {progress !== undefined && (
        <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mt-2">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface SummaryGridProps {
  stats: {
    score: number;
    uploadedDocs: number;
    verifiedDocs: number;
    pendingVerification: number;
    rejectedDocs: number;
    expiringDocs: number;
    pendingReqs: number;
    passportStatus: string;
  };
}

export default function DashboardCards({ stats }: SummaryGridProps) {
  const isTrusted = stats.passportStatus === 'TRUSTED';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Compliance Score"
        value={`${stats.score}%`}
        subtext="Overall rating verification score"
        icon={ShieldCheck}
        trendColor="text-indigo-400"
        progress={stats.score}
      />
      <MetricCard
        title="Uploaded Documents"
        value={stats.uploadedDocs}
        subtext="Total files active in vault"
        icon={FileText}
        trendColor="text-blue-400"
      />
      <MetricCard
        title="Verified Documents"
        value={stats.verifiedDocs}
        subtext="Approved by authority"
        icon={CheckCircle2}
        trendColor="text-emerald-400"
        progress={
          stats.uploadedDocs > 0
            ? Math.round((stats.verifiedDocs / stats.uploadedDocs) * 100)
            : 0
        }
      />
      <MetricCard
        title="Pending Verification"
        value={stats.pendingVerification}
        subtext="Awaiting review queue"
        icon={Clock}
        trendColor="text-amber-400"
      />
      <MetricCard
        title="Rejected Documents"
        value={stats.rejectedDocs}
        subtext="Awaiting resubmission action"
        icon={XCircle}
        trendColor={stats.rejectedDocs > 0 ? "text-rose-500" : "text-zinc-500"}
      />
      <MetricCard
        title="Expiring Documents"
        value={stats.expiringDocs}
        subtext="Expiring within 90 days"
        icon={AlertTriangle}
        trendColor={stats.expiringDocs > 0 ? "text-amber-500 animate-pulse" : "text-zinc-500"}
      />
      <MetricCard
        title="Active Applications"
        value={stats.pendingReqs}
        subtext="Applications under review"
        icon={Share2}
        trendColor={stats.pendingReqs > 0 ? "text-violet-400 animate-pulse" : "text-zinc-500"}
      />
    </div>
  );
}
