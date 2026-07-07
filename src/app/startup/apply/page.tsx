'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import {
  Landmark,
  Sliders,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ApplyToInstitution() {
  const { user } = useAuth();
  const router = useRouter();

  // State lists
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [verifiedDocs, setVerifiedDocs] = useState<any[]>([]);
  const [passport, setPassport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form states
  const [selectedInstId, setSelectedInstId] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('Business Loan');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [sharePassport, setSharePassport] = useState(true);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const purposes = [
    'Business Loan',
    'Merchant Onboarding',
    'Investment',
    'Vendor Registration',
    'Government Grant',
    'Compliance Review',
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [instRes, docsRes, passportRes] = await Promise.all([
        fetch('/api/institutions'),
        fetch('/api/documents'),
        fetch('/api/passport'),
      ]);

      if (instRes.ok && docsRes.ok) {
        const instData = await instRes.json();
        const docsData = await docsRes.json();

        setInstitutions(instData.institutions || []);
        
        // Filter verified documents
        const verified = (docsData.documents || []).filter(
          (d: any) =>
            d.status === 'VERIFIED' ||
            d.status === 'AI_VALIDATED' ||
            d.status === 'Verified'
        );
        setVerifiedDocs(verified);
        
        // Default select all verified documents
        setSelectedDocIds(verified.map((d: any) => d.id));
      }

      if (passportRes.ok) {
        const passportData = await passportRes.json();
        setPassport(passportData.passport || null);
      }
    } catch (error) {
      console.error('Failed to load application form data:', error);
      toast.error('Failed to load available institutions or verified documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleDocToggle = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInstId) {
      toast.error('Please select a recipient institution.');
      return;
    }

    if (sharePassport && !passport) {
      toast.error('Compliance Passport is offline. Verify your core documents first.');
      return;
    }

    // Get document types of selected document IDs
    const selectedTypes = verifiedDocs
      .filter((d) => selectedDocIds.includes(d.id))
      .map((d) => d.type);

    try {
      setSubmitting(true);
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: selectedInstId,
          purpose: selectedPurpose,
          documentTypes: selectedTypes,
          sharedDocumentIds: selectedDocIds,
          sharePassport,
          additionalNotes,
        }),
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        setSubmittedSuccess(true);
        // Clear form
        setSelectedInstId('');
        setAdditionalNotes('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Submission failed.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-border/40 w-1/3 rounded-xl" />
        <div className="h-60 bg-border/40 rounded-3xl" />
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-card/40 border border-border/40 rounded-3xl p-8 md:p-12 text-center space-y-6 animate-in fade-in duration-300">
        <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-foreground">Application Submitted Successfully</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            The selected institution has received your trusted Compliance Passport and verified documents.
            You can monitor reviews and check status updates in the tracker.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <button
            onClick={() => setSubmittedSuccess(false)}
            className="px-5 h-10 text-xs font-bold text-foreground bg-zinc-950/40 hover:bg-zinc-900 border border-border/40 rounded-xl transition-all"
          >
            Apply Again
          </button>
          <button
            onClick={() => router.push('/startup/requests')}
            className="px-5 h-10 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm shadow-primary/20 flex items-center"
          >
            Track Status
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Apply to Institution</h1>
        <p className="text-xs text-muted-foreground">
          Submit your verified Compliance Passport and selected credentials directly to trusted banks, VCs, and gateways.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: The Application Form */}
        <div className="lg:col-span-2 bg-card/40 border border-border/40 rounded-3xl p-6 md:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Institution Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Select Recipient Institution <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedInstId}
                onChange={(e) => setSelectedInstId(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-3 text-foreground font-semibold outline-none focus:border-primary"
              >
                <option value="" disabled>-- Select Partner Institution --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.description || 'Verified Partner'})
                  </option>
                ))}
              </select>
            </div>

            {/* Purpose Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Select Purpose <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-3 text-foreground font-semibold outline-none focus:border-primary"
              >
                {purposes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Reusable Passport Toggle */}
            <div className="bg-zinc-950/30 border border-border/30 rounded-2xl p-4 flex items-start justify-between">
              <div className="space-y-1 pr-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-4.5 w-4.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">Share Compliance Passport</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Grant access to your authoritative compliance score, verification stamps, and dynamically sealed passport metadata.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={sharePassport}
                  onChange={(e) => setSharePassport(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Verified Documents Checklist */}
            <div className="space-y-3">
              <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Choose Verified Documents to Share
              </label>
              
              {verifiedDocs.length === 0 ? (
                <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-2xl text-xs">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <p>
                    No verified documents found. Please visit the{' '}
                    <span
                      onClick={() => router.push('/startup/documents')}
                      className="underline font-bold cursor-pointer hover:text-amber-300"
                    >
                      Documents page
                    </span>{' '}
                    to upload and complete AI verification.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {verifiedDocs.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleDocToggle(doc.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary/5 border-primary/40 text-foreground'
                            : 'bg-zinc-950/20 border-border/40 text-muted-foreground'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <p className="text-[10px] uppercase tracking-wider font-mono font-bold text-zinc-400">{doc.type}</p>
                          <p className="text-xs font-bold truncate text-foreground">{doc.name}</p>
                        </div>
                        <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                        }`}>
                          {isSelected && <FileCheck className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Additional Notes
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Include loan references, investment terms, or specific compliance contexts here..."
                rows={4}
                className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-3 text-foreground font-semibold outline-none focus:border-primary resize-none placeholder:text-zinc-600"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center px-5 h-12 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {submitting ? (
                'Submitting Application...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Column: Dynamic Info Card */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-950/20 via-zinc-900/60 to-purple-950/20 border border-primary/30 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-primary flex items-center">
              <ShieldCheck className="h-4.5 w-4.5 mr-2 text-primary" />
              Compliance Score
            </h3>
            
            {passport ? (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">Passport ID</span>
                  <p className="font-mono font-bold text-foreground">{passport.passportId}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">Authority Seal Score</span>
                  <p className="font-bold text-indigo-400 text-lg">{passport.complianceScore}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span className="font-bold">Compliance Passport Pending</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  You need to upload and verify core documents (GST, PAN, Incorporation Certificate) to build your Compliance Passport score before applying to banks or VCs.
                </p>
              </div>
            )}
          </div>

          <div className="bg-card/20 border border-border/30 rounded-3xl p-5 text-xs space-y-3">
            <h4 className="font-bold text-foreground">Why Global Passport?</h4>
            <ul className="space-y-2 text-muted-foreground leading-relaxed text-[11px]">
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">✓</span>
                <span>Zero redundant document uploads.</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">✓</span>
                <span>Accelerated credit lines & investor due diligence.</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">✓</span>
                <span>Voluntary, audited, and revocable data consent ledger.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
