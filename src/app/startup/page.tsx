'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';
import DashboardCards from '@/components/DashboardCards';
import {
  FileText,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  ExternalLink,
  Shield,
  CheckCircle,
  User,
  History,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';

interface StartupDashboardData {
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
  expiringDocs: any[];
  recentRequests: any[];
  recentLogs: any[];
}

export default function StartupDashboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StartupDashboardData>({
    stats: {
      score: 0,
      uploadedDocs: 0,
      verifiedDocs: 0,
      pendingVerification: 0,
      rejectedDocs: 0,
      expiringDocs: 0,
      pendingReqs: 0,
      passportStatus: 'OFFLINE',
    },
    expiringDocs: [],
    recentRequests: [],
    recentLogs: [],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [docsRes, reqsRes, logsRes, passportRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/requests'),
        fetch('/api/logs'),
        fetch('/api/passport'),
      ]);

      const [docsData, reqsData, logsData, passportData] = await Promise.all([
        docsRes.json(),
        reqsRes.json(),
        logsRes.json(),
        passportRes.json(),
      ]);

      const documents = docsData.documents || [];
      const requests = reqsData.requests || [];
      const logs = logsData.logs || [];
      const score = passportData.passport?.complianceScore || 0;
      const passportStatus = passportData.passport?.status || (score >= 80 ? 'TRUSTED' : 'UNTRUSTED');

      // Extract metrics
      const uploadedDocs = documents.length;
      const verifiedDocs = documents.filter((d: any) => d.status === 'VERIFIED' || d.status === 'AI_VALIDATED' || d.status === 'Verified').length;
      const pendingVerification = documents.filter((d: any) => d.status === 'PROCESSING' || d.status === 'PENDING' || d.status === 'Uploading' || d.status === 'Low Confidence').length;
      const rejectedDocs = documents.filter((d: any) => d.status === 'REJECTED' || d.status === 'Verification Failed' || d.status === 'FAILED').length;
      const pendingReqs = requests.filter((r: any) => r.status === 'PENDING').length;

      // Find documents expiring within 90 days
      const now = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(now.getDate() + 90);

      const expiringDocs = documents.filter((d: any) => {
        if (!d.expiryDate) return false;
        const exp = new Date(d.expiryDate);
        return exp > now && exp <= ninetyDaysFromNow;
      });

      setData({
        stats: {
          score,
          uploadedDocs,
          verifiedDocs,
          pendingVerification,
          rejectedDocs,
          expiringDocs: expiringDocs.length,
          pendingReqs,
          passportStatus,
        },
        expiringDocs,
        recentRequests: requests.slice(0, 3),
        recentLogs: logs.slice(0, 4),
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.companyId) {
      loadDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-border/40 w-1/4 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-border/40 rounded-3xl" />
          <div className="h-28 bg-border/40 rounded-3xl" />
          <div className="h-28 bg-border/40 rounded-3xl" />
          <div className="h-28 bg-border/40 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-border/40 col-span-2 rounded-3xl" />
          <div className="h-80 bg-border/40 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Compliance progression trend
  const complianceTrend = [
    { name: 'Jan', Score: Math.max(0, data.stats.score - 40) },
    { name: 'Feb', Score: Math.max(0, data.stats.score - 30) },
    { name: 'Mar', Score: Math.max(0, data.stats.score - 20) },
    { name: 'Apr', Score: Math.max(0, data.stats.score - 10) },
    { name: 'May', Score: Math.max(0, data.stats.score - 5) },
    { name: 'Jun', Score: data.stats.score },
  ];

  // Document status breakdown
  const documentBreakdown = [
    { name: 'Verified', count: data.stats.verifiedDocs, color: '#10b981' },
    { name: 'Pending', count: data.stats.pendingVerification, color: '#f59e0b' },
    { name: 'Rejected', count: data.stats.rejectedDocs, color: '#ef4444' },
  ];

  // Verification Progress over time
  const verificationHistory = [
    { month: 'Jan', Verified: 0, Pending: 0, Rejected: 0 },
    { month: 'Feb', Verified: 1, Pending: 0, Rejected: 0 },
    { month: 'Mar', Verified: 1, Pending: 1, Rejected: 0 },
    { month: 'Apr', Verified: 2, Pending: 0, Rejected: 1 },
    { month: 'May', Verified: 3, Pending: 1, Rejected: 0 },
    { month: 'Jun', Verified: data.stats.verifiedDocs, Pending: data.stats.pendingVerification, Rejected: data.stats.rejectedDocs },
  ];

  return (
    <div className="space-y-8">
      {/* Upper header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="text-primary">{user?.companyName}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Registry ID: <span className="font-mono">{user?.companyId?.slice(0, 8)}</span>
          </p>
        </div>
        <Link
          href="/startup/passport"
          className="inline-flex items-center px-4 py-2 text-xs font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all"
        >
          View Passport
          <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Summary metric cards grid */}
      <DashboardCards stats={data.stats} />

      {/* Charts Grid */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compliance AreaChart */}
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6 col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground">Compliance Progression</h3>
                <p className="text-[11px] text-muted-foreground">History of credential validations</p>
              </div>
              <span className="text-xs font-bold text-primary flex items-center">
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                Score: {data.stats.score}%
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={complianceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Score"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Document Breakdown BarChart */}
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Document Status</h3>
            <p className="text-[11px] text-muted-foreground">Verification status distribution</p>
            <div className="h-64 flex flex-col justify-between">
              {data.stats.uploadedDocs > 0 ? (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={documentBreakdown} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(24, 24, 27, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {documentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
                  No documents uploaded yet.
                </div>
              )}

              <div className="border-t border-border/40 pt-4 flex justify-between items-center text-xs">
                <div>
                  <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1.5" />
                  <span className="text-muted-foreground">Verified: {data.stats.verifiedDocs}</span>
                </div>
                <div>
                  <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full mr-1.5" />
                  <span className="text-muted-foreground">Pending: {data.stats.pendingVerification}</span>
                </div>
                <div>
                  <span className="inline-block w-2.5 h-2.5 bg-rose-500 rounded-full mr-1.5" />
                  <span className="text-muted-foreground">Rejected: {data.stats.rejectedDocs}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Progress History Chart */}
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6 col-span-1 lg:col-span-3 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Verification Progress</h3>
            <p className="text-[11px] text-muted-foreground">Historical breakdown of document approvals vs rejections</p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={verificationHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Verified" stackId="a" fill="#10b981" />
                  <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Rejected" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Split Panels: Sharing Requests vs Recent Activities (Audit Logs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h3 className="text-sm font-bold text-foreground">Recent Applications</h3>
            <Link href="/startup/requests" className="text-xs text-primary hover:underline flex items-center">
              Track All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          {data.recentRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
              <Shield className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p>No applications submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/20 border border-border/20"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{req.institution.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Purpose: {req.purpose || 'Compliance Review'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    req.status === 'APPROVED' || req.status === 'COMPLETED' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                    req.status === 'REJECTED' ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400' :
                    'bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse'
                  }`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities (Audit Logs) */}
        <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h3 className="text-sm font-bold text-foreground">Recent Activities</h3>
            <Link href="/startup/logs" className="text-xs text-primary hover:underline flex items-center">
              View Audit Trail
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          {data.recentLogs.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
              <History className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p>No recent actions recorded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-900/10 border border-border/10"
                >
                  <div className="mt-0.5">
                    {log.action === 'UPLOAD' && <FileText className="h-3.5 w-3.5 text-indigo-400" />}
                    {(log.action === 'SHARE' || log.action === 'APPROVE') && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
                    {(log.action === 'REVOKE' || log.action === 'REJECT') && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-semibold leading-normal truncate">{log.details}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
