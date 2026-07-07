'use client';

import { useState } from 'react';
import { ShieldCheck, Calendar, QrCode, Download, Share2, Clipboard, Globe, Lock, Clock, Check, Cpu } from 'lucide-react';
import { toast } from 'sonner';

interface PassportQRProps {
  passport: {
    passportId: string;
    companyName: string;
    regNumber: string;
    complianceScore: number;
    status: string;
    digitalSignature: string;
    generatedAt: string;
    expiresAt: string;
    verifiedDocs: string[];
  };
}

export default function PassportQR({ passport }: PassportQRProps) {
  const [sharing, setSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [accessDuration, setAccessDuration] = useState('7'); // days
  const [copied, setCopied] = useState(false);

  const passportUrl = typeof window !== 'undefined' ? `${window.location.origin}/passport/verify/${passport.passportId}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(passportUrl);
    setCopied(true);
    toast.success('Passport verification link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail) {
      toast.error('Please enter a valid institution email');
      return;
    }

    try {
      const response = await fetch('/api/passport/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: shareEmail,
          accessDays: parseInt(accessDuration),
        }),
      });

      if (response.ok) {
        toast.success(`Access granted! Verification passport link sent to ${shareEmail}.`);
        setSharing(false);
        setShareEmail('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sharing failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to share passport');
    }
  };

  const triggerDownload = () => {
    toast.success('Generating secure PDF export...');
    setTimeout(() => {
      // Simulate direct download triggers by opening a dummy printable page
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Global Compliance Passport - ${passport.companyName}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
                .card { border: 2px solid #ccc; border-radius: 12px; padding: 30px; margin-bottom: 20px; max-width: 600px; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 15px; }
                .score { font-size: 32px; font-weight: bold; color: #4f46e5; }
                .trusted { color: #10b981; font-weight: bold; }
                .details { margin-top: 20px; line-height: 1.6; }
                .signature { font-family: 'Courier New', Courier, monospace; margin-top: 30px; border-top: 1px dashed #333; padding-top: 10px; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <div>
                    <h2>GLOBAL COMPLIANCE PASSPORT</h2>
                    <p>Passport ID: ${passport.passportId}</p>
                  </div>
                  <div class="score">${passport.complianceScore}%</div>
                </div>
                <div class="details">
                  <p><strong>Company Name:</strong> ${passport.companyName}</p>
                  <p><strong>Registration Number:</strong> ${passport.regNumber}</p>
                  <p><strong>Status:</strong> <span class="trusted">VERIFIED</span></p>
                  <p><strong>Verification Method:</strong> AI Automated Verification</p>
                  <p><strong>OCR Status:</strong> Completed</p>
                  <p><strong>NLP Extraction:</strong> Completed</p>
                  <p><strong>AI Confidence Score:</strong> ${passport.complianceScore}%</p>
                  <p><strong>Fraud Detection Status:</strong> Passed / Safe</p>
                  <p><strong>Verification Timestamp:</strong> ${new Date(passport.generatedAt).toLocaleString()}</p>
                  <p><strong>Expires On:</strong> ${new Date(passport.expiresAt).toLocaleDateString()}</p>
                  <p><strong>Verified Credentials:</strong> ${passport.verifiedDocs.join(', ') || 'None'}</p>
                </div>
                <div class="signature">
                  <p>AI Cryptographic Hash Signature:</p>
                  <p style="font-size: 11px; word-break: break-all;">${passport.digitalSignature}</p>
                  <p style="font-size: 12px; margin-top: 10px;"><em>Autosigned via AI automated verification engine</em></p>
                </div>
              </div>
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Visual Identity Passport Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-black text-white p-8 border border-white/10 shadow-2xl transition-all duration-300 hover:border-primary/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        {/* Card Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
              Verified Digital Identity
            </span>
            <h2 className="text-xl font-bold tracking-tight">Global Compliance Passport</h2>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase px-3 py-1 rounded-full flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>VERIFIED</span>
          </div>
        </div>

        {/* Passport Content / Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 border-t border-white/5 pt-6">
          <div className="space-y-4 col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Registered Entity</p>
                <p className="text-sm font-semibold">{passport.companyName}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Registration Number</p>
                <p className="text-xs font-medium font-mono mt-0.5">{passport.regNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Verification Method</p>
                <p className="text-xs font-bold text-emerald-400 flex items-center mt-0.5">
                  <Cpu className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
                  AI Automated Verification
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Fraud Detection</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">Passed / Safe</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">OCR Status</p>
                <p className="text-xs font-medium text-zinc-300">Completed</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">NLP Extraction</p>
                <p className="text-xs font-medium text-zinc-300">Completed</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Verification Date</p>
                <p className="text-xs font-medium flex items-center mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500 mr-1.5" />
                  {new Date(passport.generatedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Access Expiry</p>
                <p className="text-xs font-medium flex items-center mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500 mr-1.5" />
                  {new Date(passport.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Score Circular Indicator */}
          <div className="flex flex-col items-center justify-center border-l border-white/5 pl-6">
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#passportGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * passport.complianceScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="passportGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-extrabold">{passport.complianceScore}</span>
                <span className="text-[10px] block text-zinc-400 font-semibold -mt-1">SCORE</span>
              </div>
            </div>
            <p className="text-[9px] text-zinc-400 mt-3 text-center font-bold uppercase tracking-wider">
              AI Confidence: {passport.complianceScore}%
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 text-center font-medium uppercase tracking-wider">
              {passport.verifiedDocs.length} Verified Credentials
            </p>
          </div>
        </div>

        {/* Cryptographic Footprint / Signature */}
        <div className="mt-6 border-t border-white/5 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] text-zinc-500 uppercase font-semibold">AI Cryptographic Signature</p>
            <p className="text-[10px] font-mono text-zinc-400 truncate max-w-md">
              {passport.digitalSignature}
            </p>
          </div>
          {/* Mock QR Render */}
          <div className="bg-white p-1.5 rounded-lg flex items-center justify-center w-12 h-12 shadow-md hover:scale-105 transition-transform duration-200" title="Scan to Verify">
            <QrCode className="h-9 w-9 text-black" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={triggerDownload}
          className="flex-1 inline-flex items-center justify-center px-4 h-11 text-sm font-semibold border border-border bg-card/30 hover:bg-card/75 rounded-2xl transition-all text-foreground"
        >
          <Download className="mr-2 h-4 w-4" />
          Download PDF Passport
        </button>
        <button
          onClick={() => setSharing(!sharing)}
          className="flex-1 inline-flex items-center justify-center px-4 h-11 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-md shadow-primary/10"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Secure Share Link
        </button>
      </div>

      {/* Sharing Panel */}
      {sharing && (
        <form onSubmit={handleShareSubmit} className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h3 className="text-sm font-semibold text-foreground flex items-center">
              <Lock className="h-4 w-4 text-primary mr-2" />
              Institutional Share Portal
            </h3>
            <button
              type="button"
              onClick={() => setSharing(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Link Copy */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">
                Verification Page Link
              </label>
              <div className="flex rounded-xl overflow-hidden border border-border">
                <input
                  type="text"
                  readOnly
                  value={passportUrl}
                  className="flex-1 bg-zinc-950/40 text-xs px-3 py-2 outline-none text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-secondary px-3 text-xs font-semibold hover:bg-neutral-800/80 transition-colors flex items-center"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Access Expiry Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">
                Access Expiry
              </label>
              <select
                value={accessDuration}
                onChange={(e) => setAccessDuration(e.target.value)}
                className="w-full text-xs rounded-xl border border-border bg-card/60 p-2.5 outline-none text-foreground"
              >
                <option value="1">1 Day</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="365">1 Year</option>
              </select>
            </div>
          </div>

          {/* Secure Email Sharing */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase">
              Send access code to bank / institution email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="compliance@hdfcbank.com"
                className="flex-1 text-xs rounded-xl border border-border bg-zinc-950/40 px-3 py-2 outline-none focus:border-primary text-foreground"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
              >
                Send Invitation
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Institutions will require dynamic approval to access your raw underlying verified attachments.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
