'use client';

import { Cpu, AlertTriangle, ShieldCheck, XCircle, FileText, Check } from 'lucide-react';

interface AdminReviewModalProps {
  document: any;
  onClose: () => void;
  onActionComplete: () => void;
}

export default function AdminReviewModal({ document: doc, onClose, onActionComplete }: AdminReviewModalProps) {

  // Parsing OCR JSON Data
  let ocrData: Record<string, any> = {};
  try {
    ocrData = JSON.parse(doc.ocrData || '{}');
  } catch (e) {
    ocrData = {};
  }

  // Smart heuristic calculations for mock fraud analysis
  const hasCinOrGstin = ocrData.gstin || ocrData.cin || ocrData.pan || ocrData.licenseNumber;
  const isOcrComplete = Object.keys(ocrData).length > 2;
  const confidenceScore = (doc.status === 'VERIFIED' || doc.status === 'AI_VALIDATED') ? 98 : doc.status === 'REJECTED' ? 45 : 94.6;

  // Mock Fraud Alerts
  const fraudChecklist = {
    duplicateCheck: doc.name.includes('duplicate') || doc.comments?.includes('duplicate') || false,
    blurDetected: doc.name.includes('blur') || false,
    missingFields: !hasCinOrGstin || !isOcrComplete,
  };



  return (
    <div className="bg-card/40 border border-primary/30 rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-border/40">
        <h3 className="text-sm font-bold text-foreground flex items-center">
          <Cpu className="h-4.5 w-4.5 text-primary mr-2" />
          AI Review & Action Drawer
        </h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Startup Context */}
        <div className="space-y-0.5">
          <span className="text-[9px] text-zinc-500 uppercase font-semibold">Registered Company</span>
          <p className="text-sm font-bold text-foreground">{doc.company?.name || 'Startup Corporation'}</p>
          <p className="text-[10px] text-muted-foreground font-mono">CIN: {doc.company?.regNumber}</p>
        </div>

        {/* Document Context */}
        <div className="grid grid-cols-2 gap-3.5 border-t border-border/40 pt-3">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase font-semibold">File Name</span>
            <p className="font-semibold text-foreground truncate">{doc.name}</p>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 uppercase font-semibold">Document Class</span>
            <p className="font-bold text-primary uppercase font-mono">{doc.type}</p>
          </div>
        </div>

        {/* OCR Parsed Attributes */}
        <div className="space-y-2 border-t border-border/40 pt-3">
          <span className="text-[9px] text-zinc-500 uppercase font-semibold">OCR Extracted Claims</span>
          {Object.keys(ocrData).length === 0 ? (
            <p className="text-muted-foreground italic text-[11px]">No metadata fields parsed.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 bg-zinc-950/45 p-3 rounded-2xl font-mono text-[10px]">
              {Object.entries(ocrData).map(([key, val]) => (
                <div key={key} className="col-span-2 flex justify-between border-b border-border/10 pb-0.5">
                  <span className="text-zinc-500 capitalize">{key}:</span>
                  <span className="text-foreground font-bold truncate max-w-[130px]">{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fraud Intelligence Block */}
        <div className="space-y-2 border-t border-border/40 pt-3">
          <span className="text-[9px] text-zinc-500 uppercase font-semibold">AI Integrity Audit</span>
          <div className="space-y-2">
            {/* Duplicate Warnings */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              fraudChecklist.duplicateCheck ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-zinc-900/20 border-border/20 text-zinc-400'
            }`}>
              <span className="font-semibold">Duplicate Document Check</span>
              {fraudChecklist.duplicateCheck ? (
                <span className="text-[9px] font-bold uppercase tracking-wider flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Flagged (Match Found)
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                  <Check className="h-3 w-3 mr-1" /> Safe (Unique)
                </span>
              )}
            </div>

            {/* Blur warnings */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              fraudChecklist.blurDetected ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse' : 'bg-zinc-900/20 border-border/20 text-zinc-400'
            }`}>
              <span className="font-semibold">Blur & Legibility Check</span>
              {fraudChecklist.blurDetected ? (
                <span className="text-[9px] font-bold uppercase tracking-wider flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Highly Blurred
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                  <Check className="h-3 w-3 mr-1" /> High Clarity
                </span>
              )}
            </div>

            {/* AI Confidence Meter */}
            <div className="bg-zinc-900/20 border border-border/20 p-2.5 rounded-xl flex justify-between items-center">
              <span className="font-semibold text-zinc-400">OCR Confidence Score</span>
              <span className="text-primary font-extrabold">{confidenceScore}%</span>
            </div>
          </div>
        </div>

        {/* AI Final Decision Display */}
        <div className="space-y-2 border-t border-border/40 pt-3">
          <span className="text-[9px] text-zinc-500 uppercase font-semibold">AI Auto-Decision Registry</span>
          <div className="space-y-2">
            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
               doc.status === 'VERIFIED' || doc.status === 'AI_VALIDATED'
                 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                 : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
             }`}>
               {doc.status === 'VERIFIED' || doc.status === 'AI_VALIDATED' ? (
                 <ShieldCheck className="h-5 w-5 shrink-0" />
               ) : (
                 <XCircle className="h-5 w-5 shrink-0" />
               )}
               <div>
                 <p className="font-bold text-[10px] uppercase tracking-wider">
                   {doc.status === 'VERIFIED' || doc.status === 'AI_VALIDATED' ? 'AI AUTO-VERIFIED' : 'AI AUTO-REJECTED'}
                 </p>
                <p className="text-[10px] text-muted-foreground leading-normal mt-0.5 font-sans">
                  {doc.comments || 'Processed by System AI Engine.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
