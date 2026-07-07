'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AppContext';
import {
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Upload,
  MessageSquare,
  RefreshCw,
  Shield,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function VerificationStatus() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [replacingType, setReplacingType] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load credentials verification status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const triggerReplace = (id: string, type: string) => {
    setReplacingDocId(id);
    setReplacingType(type);
    setTimeout(() => {
      replaceFileInputRef.current?.click();
    }, 100);
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingDocId || !replacingType) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      toast.error('Unsupported file format. Please upload PDF or image files.');
      return;
    }

    setLoading(true);
    toast.info(`Resubmitting credential file ${file.name}...`);

    try {
      // 1. Delete old document
      const deleteRes = await fetch(`/api/documents/${replacingDocId}`, {
        method: 'DELETE',
      });
      if (!deleteRes.ok) throw new Error('Failed to clear old document record.');

      // 2. Upload replacement
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', replacingType);
      formData.append('name', file.name);

      const uploadRes = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload resubmitted document.');

      toast.success('Document successfully resubmitted for verification!');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Resubmission failed');
    } finally {
      setLoading(false);
      setReplacingDocId(null);
      setReplacingType(null);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
      case 'VERIFIED':
      case 'AI_VALIDATED':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center w-fit">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Verified
          </span>
        );
      case 'Low Confidence':
        return (
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center w-fit">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            Low Confidence
          </span>
        );
      case 'Verification Failed':
      case 'REJECTED':
      case 'FAILED':
        return (
          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center w-fit">
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Verification Failed
          </span>
        );
      default:
        return (
          <span className="bg-neutral-500/10 border border-neutral-500/20 text-neutral-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center w-fit">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            {status}
          </span>
        );
    }
  };

  // Parses comment column to extract validation metrics
  const getValidationMeta = (doc: any) => {
    if (!doc.comments) return { score: 90, fraudCheck: 'Passed', duplicateCheck: 'Passed', ocrStatus: 'Completed', nlpStatus: 'Completed' };
    if (doc.comments.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(doc.comments);
        return {
          score: parsed.score || 90,
          fraudCheck: parsed.fraudCheck || 'Passed',
          duplicateCheck: parsed.duplicateCheck || 'Passed',
          ocrStatus: parsed.ocrStatus || 'Completed',
          nlpStatus: parsed.nlpStatus || 'Completed'
        };
      } catch (e) {
        // fallback
      }
    }
    return { score: 90, fraudCheck: 'Passed', duplicateCheck: 'Passed', ocrStatus: 'Completed', nlpStatus: 'Completed' };
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight font-sans">Verification Status</h1>
        <p className="text-xs text-muted-foreground font-medium">
          Inspect document OCR statuses, NLP field extraction accuracy, fraud detection passes, and final validation status
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleReplaceFileChange}
        className="hidden"
      />

      <div className="bg-card/40 border border-border/40 rounded-3xl p-6">
        <h3 className="text-base font-semibold mb-6 text-foreground flex items-center">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          AI Verification Status Ledger
        </h3>

        {loading && documents.length === 0 ? (
          <div className="space-y-3.5 py-8">
            <div className="h-10 bg-border/20 rounded-xl animate-pulse" />
            <div className="h-10 bg-border/20 rounded-xl animate-pulse" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-3">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <div>
              <p className="text-sm font-semibold">No Documents Uploaded</p>
              <p className="text-xs mt-1">Uploaded credentials will display verification statuses here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-bold tracking-wider uppercase">
                  <th className="py-3.5 px-4">Document Details</th>
                  <th className="py-3.5 px-4 text-center">OCR Status</th>
                  <th className="py-3.5 px-4 text-center">AI Confidence</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {documents.map((doc) => {
                  const meta = getValidationMeta(doc);
                  const showAction = doc.status === 'Low Confidence' || doc.status === 'Verification Failed' || doc.status === 'Expired' || doc.status === 'REJECTED';

                  return (
                    <tr key={doc.id} className="hover:bg-zinc-900/10 transition-colors">
                      {/* Document Details */}
                      <td className="py-4 px-4 font-semibold">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground truncate max-w-[150px]">{doc.name}</p>
                            <span className="text-[9px] uppercase font-bold text-zinc-500">{doc.type}</span>
                          </div>
                        </div>
                      </td>

                      {/* OCR Status */}
                      <td className="py-4 px-4 text-center font-bold text-emerald-400">
                        Completed
                      </td>

                      {/* AI Confidence */}
                      <td className="py-4 px-4 text-center font-bold">
                        {showAction ? (
                          <span className="text-rose-450 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] text-rose-400">
                            Not Completed
                          </span>
                        ) : (
                          <span className="text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] text-emerald-400">
                            Completed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        {showAction ? (
                          <button
                            onClick={() => triggerReplace(doc.id, doc.type)}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-sm"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Resubmit
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerReplace(doc.id, doc.type)}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-neutral-800/40 rounded-xl transition-all border border-border/40"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Replace
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
