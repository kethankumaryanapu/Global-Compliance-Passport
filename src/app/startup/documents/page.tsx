'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AppContext';
import DocumentUploadZone from '@/components/DocumentUploadZone';
import {
  FileText,
  Calendar,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  XCircle,
  Cpu,
  Download,
  Upload,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  ShieldAlert,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function StartupDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [replacingType, setReplacingType] = useState<string | null>(null);
  const [processingAIdocId, setProcessingAIdocId] = useState<string | null>(null);

  const runAIExtraction = async (docId: string, ocrText: string) => {
    try {
      setProcessingAIdocId(docId);
      toast.info('Running AI LLM structuring on document...');
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, ocrText }),
      });
      if (res.ok) {
        toast.success('AI structuring complete!');
        // Refresh documents to load the relation
        const refreshRes = await fetch('/api/documents');
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setDocuments(data.documents || []);
          const found = data.documents?.find((d: any) => d.id === docId);
          if (found) setSelectedDoc(found);
        }
      } else {
        throw new Error('AI processing failed');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Could not complete AI extraction');
    } finally {
      setProcessingAIdocId(null);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Could not load documents list');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This will remove it from your passport and access keys.')) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Document deleted successfully');
        if (selectedDoc?.id === id) setSelectedDoc(null);
        fetchDocuments();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Deletion failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not delete document');
    }
  };

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
    toast.info(`Replacing document with ${file.name}...`);

    try {
      // 1. Delete the old document record
      const deleteRes = await fetch(`/api/documents/${replacingDocId}`, {
        method: 'DELETE',
      });

      if (!deleteRes.ok) {
        throw new Error('Failed to remove existing document for replacement.');
      }

      // 2. Upload the new file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', replacingType);
      formData.append('name', file.name);

      const uploadRes = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload new replacement document.');
      }

      toast.success('Document replaced successfully!');
      fetchDocuments();
      setSelectedDoc(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Replacement failed');
    } finally {
      setLoading(false);
      setReplacingDocId(null);
      setReplacingType(null);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // Decides Status Badges matching exact request statuses:
  // Uploading, OCR Processing, AI Validation, Verified, Low Confidence, Verification Failed, Expired
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
      case 'VERIFIED':
      case 'AI_VALIDATED':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </span>
        );
      case 'Low Confidence':
        return (
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit">
            <AlertCircle className="h-3 w-3 mr-1" />
            Low Confidence
          </span>
        );
      case 'Verification Failed':
      case 'REJECTED':
      case 'FAILED':
        return (
          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit">
            <XCircle className="h-3 w-3 mr-1" />
            Verification Failed
          </span>
        );
      case 'Expired':
      case 'EXPIRED':
        return (
          <span className="bg-neutral-500/10 border border-neutral-500/20 text-neutral-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </span>
        );
      case 'Uploading':
        return (
          <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit animate-pulse">
            <RefreshCw className="h-3 w-3 mr-1" />
            Uploading
          </span>
        );
      case 'OCR Processing':
      case 'PROCESSING':
        return (
          <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit animate-pulse">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            OCR Processing
          </span>
        );
      case 'AI Validation':
        return (
          <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit animate-pulse">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            AI Validation
          </span>
        );
      default:
        return (
          <span className="bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center w-fit">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </span>
        );
    }
  };

  // Parses comment column to extract RAG/Universal engine validation report details
  const getParsedReport = (doc: any) => {
    if (!doc?.comments) return null;
    if (doc.comments.trim().startsWith('{')) {
      try {
        return JSON.parse(doc.comments);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Credentials Locker</h1>
        <p className="text-xs text-muted-foreground">
          Upload and verify your core business documents to build your trusted Compliance Passport
        </p>
      </div>

      {/* Hidden file input for document replacement */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleReplaceFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Upload Zone (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <DocumentUploadZone onUploadSuccess={fetchDocuments} />

          {/* Documents Grid */}
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-foreground">Active Credentials</h3>
              <span className="text-xs text-muted-foreground font-semibold">{documents.length} Files</span>
            </div>

            {loading && documents.length === 0 ? (
              <div className="space-y-4 py-8">
                <div className="h-16 bg-border/20 rounded-2xl animate-pulse" />
                <div className="h-16 bg-border/20 rounded-2xl animate-pulse" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground space-y-3 border border-dashed border-border/40 rounded-2xl">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-semibold">No Documents Uploaded</p>
                  <p className="text-xs mt-1">Select document type above and upload to verify your startup</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const report = getParsedReport(doc);
                  const displayStatus = doc.status;

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`flex flex-col justify-between p-5 rounded-2xl bg-zinc-900/20 border transition-all cursor-pointer hover:border-primary/50 relative overflow-hidden ${
                        selectedDoc?.id === doc.id ? 'border-primary shadow-lg shadow-primary/5' : 'border-border/30'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[9px] uppercase font-bold text-primary tracking-wider">{doc.type}</span>
                            <h4 className="text-xs font-bold text-foreground truncate pr-2" title={doc.name}>
                              {doc.name}
                            </h4>
                          </div>
                          <span className="text-[9px] bg-border/50 text-foreground px-2 py-0.5 rounded font-bold shrink-0">
                            v1.0
                          </span>
                        </div>

                        {/* Status grids */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-b border-border/10 py-2.5 my-1">
                          <div>
                            <span className="text-[9px] text-zinc-500 block uppercase font-medium">AI Validation</span>
                            <span className={`font-semibold ${
                              displayStatus === 'Verified' || displayStatus === 'VERIFIED'
                                ? 'text-emerald-400' 
                                : displayStatus === 'Low Confidence' 
                                ? 'text-amber-400' 
                                : displayStatus === 'Verification Failed' || displayStatus === 'REJECTED'
                                ? 'text-rose-400' 
                                : 'text-blue-400'
                            }`}>
                              {displayStatus === 'VERIFIED' || displayStatus === 'AI_VALIDATED' ? 'Verified' : displayStatus}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 block uppercase font-medium">OCR Status</span>
                            <span className="font-semibold text-emerald-400">Completed</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-[10px] text-muted-foreground font-semibold">
                          <p className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1.5" />
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                          {doc.expiryDate && (
                            <p className="flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1.5" />
                              Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-border/10">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 hover:text-primary hover:bg-neutral-800/40 rounded-lg transition-colors text-muted-foreground"
                          title="View document"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <a
                          href={doc.url}
                          download={doc.name}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 hover:text-primary hover:bg-neutral-800/40 rounded-lg transition-colors text-muted-foreground"
                          title="Download document"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerReplace(doc.id, doc.type);
                          }}
                          className="p-1.5 hover:text-primary hover:bg-neutral-800/40 rounded-lg transition-colors text-muted-foreground"
                          title="Replace file"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground ml-auto"
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* AI Processing Details Panel (Right Column) */}
        <div className="lg:col-span-1">
          {selectedDoc ? (() => {
            const displayStatus = selectedDoc.status;
            const isProcessing = selectedDoc.status === 'OCR Processing' || selectedDoc.status === 'PROCESSING' || selectedDoc.status === 'Uploading';
            const aiExtraction = selectedDoc.aiExtraction;

            let aiFields: Record<string, any> = {};
            let aiMissing: string[] = [];
            if (aiExtraction) {
              try {
                aiFields = JSON.parse(aiExtraction.extractedFields || '{}');
              } catch (e) {
                aiFields = {};
              }
              try {
                aiMissing = JSON.parse(aiExtraction.missingFields || '[]');
              } catch (e) {
                aiMissing = [];
              }
            }

            return (
              <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center pb-2 border-b border-border/40">
                  <h3 className="text-sm font-bold text-foreground flex items-center">
                    <Cpu className="h-4.5 w-4.5 text-primary mr-2" />
                    AI Validation Details
                  </h3>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>

                {/* Disclaimer banner */}
                <div className="p-3 bg-zinc-950/40 border border-border/30 rounded-2xl text-[10px] text-muted-foreground leading-normal italic text-center">
                  "AI analysis is informational only. Final verification is performed by the Trusted Authority."
                </div>

                {/* Progress bar for OCR */}
                {isProcessing && (
                  <div className="space-y-1 bg-zinc-950/20 p-3 rounded-2xl border border-border/20 text-xs">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold block">OCR Progress</span>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-semibold mt-0.5">
                      <span>Analyzing text layout...</span>
                      <span>90%</span>
                    </div>
                    <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-primary h-full w-[90%] rounded-full animate-pulse" />
                    </div>
                  </div>
                )}

                {aiExtraction ? (
                  <div className="space-y-4 text-xs">
                    {/* Summary Card */}
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">AI Document Summary</span>
                      <p className="font-medium text-foreground mt-1 bg-zinc-950/30 p-3 rounded-2xl border border-border/10 leading-relaxed">
                        {aiExtraction.summary}
                      </p>
                    </div>

                    {/* Type and Confidence indicators */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-950/20 border border-border/20 p-3 rounded-2xl space-y-0.5">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">AI Document Type</span>
                        <p className="font-bold text-foreground truncate">{aiExtraction.documentType}</p>
                      </div>
                      <div className="bg-zinc-950/20 border border-border/20 p-3 rounded-2xl space-y-0.5">
                        <span className="text-[9px] text-zinc-500 uppercase font-semibold">AI Confidence Score</span>
                        <p className={`font-bold ${aiExtraction.confidence >= 85 ? 'text-emerald-400' : aiExtraction.confidence >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {aiExtraction.confidence}%
                        </p>
                      </div>
                    </div>

                    {/* Duplicate Detection Warning */}
                    <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                      aiExtraction.duplicateDetected 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 font-bold' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold'
                    }`}>
                      <span>Duplicate Scan Check</span>
                      <span>{aiExtraction.duplicateDetected ? 'Duplicate Detected ⚠️' : 'Safe (Unique) ✓'}</span>
                    </div>

                    {/* Extracted Key Value Claims */}
                    <div className="space-y-2 border-t border-border/40 pt-3">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Extracted Fields</span>
                      {Object.keys(aiFields).length === 0 ? (
                        <p className="text-muted-foreground italic">No fields extracted.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-1.5 bg-zinc-950/40 border border-border/45 p-3 rounded-2xl font-mono text-[9px]">
                          {Object.entries(aiFields).map(([key, val]) => (
                            <div key={key} className="flex justify-between border-b border-border/10 pb-1">
                              <span className="text-zinc-500 capitalize">{key}:</span>
                              <span className="text-foreground font-bold truncate max-w-[170px]" title={String(val)}>
                                {String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Missing Fields list */}
                    {aiMissing.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-amber-400 uppercase font-bold block">Missing Fields</span>
                        <div className="bg-amber-950/10 border border-amber-500/10 p-2.5 rounded-2xl text-amber-300/90 font-medium">
                          {aiMissing.join(', ')}
                        </div>
                      </div>
                    )}

                    {/* Timeline stage */}
                    <div className="border-t border-border/40 pt-4 space-y-3">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">AI Processing Timeline</span>
                      <div className="flex flex-col space-y-3 pl-3 text-[10px] relative before:absolute before:left-1 before:inset-y-1.5 before:w-0.5 before:bg-border/60">
                        <div className="relative flex items-center space-x-2">
                          <div className="absolute left-[-11px] w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-muted-foreground">OCR raw text extracted</span>
                        </div>
                        <div className="relative flex items-center space-x-2">
                          <div className="absolute left-[-11px] w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-muted-foreground">LLM structured information parsed</span>
                        </div>
                        <div className="relative flex items-center space-x-2">
                          <div className="absolute left-[-11px] w-2 h-2 rounded-full bg-primary" />
                          <span className="font-bold text-foreground">
                            Analysis Pipeline Finished in <span className="text-primary font-bold">{aiExtraction.processingTime}ms</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-4 text-xs">
                    <p className="text-muted-foreground">
                      This document has not been analyzed by the LLM post-OCR structuring engine yet.
                    </p>
                    <button
                      onClick={() => runAIExtraction(selectedDoc.id, selectedDoc.ocrText || '')}
                      disabled={processingAIdocId === selectedDoc.id}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {processingAIdocId === selectedDoc.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Structuring...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Run AI Analysis</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="bg-card/20 border border-border/40 border-dashed rounded-3xl p-12 text-center text-xs text-muted-foreground space-y-2">
              <Cpu className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="font-semibold">No Document Selected</p>
              <p>Select any credential card to inspect parsed validation results and AI verification logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
