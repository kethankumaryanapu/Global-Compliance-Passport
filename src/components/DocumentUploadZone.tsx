'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadZoneProps {
  onUploadSuccess: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'GST', label: 'GST Registration Certificate' },
  { value: 'PAN', label: 'PAN Card Proof' },
  { value: 'INCORPORATION', label: 'Certificate of Incorporation' },
  { value: 'FSSAI', label: 'FSSAI License' },
  { value: 'TAX_CERTIFICATE', label: 'Tax Compliance Certificate' },
  { value: 'BUSINESS_LICENSE', label: 'Local Business License' },
  { value: 'FINANCIALS', label: 'Audited Financial Statement' },
  { value: 'KYC', label: 'Director KYC (DIN / National ID)' },
  { value: 'BANK_PROOF', label: 'Bank Account Statement' },
  { value: 'PASSPORT', label: 'Founder Passport Scan' },
  { value: 'OTHER', label: 'Other Supporting PDF / Image' },
];

export default function DocumentUploadZone({ onUploadSuccess }: DocumentUploadZoneProps) {
  const [docType, setDocType] = useState<string>('GST');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [uploadStep, setUploadStep] = useState<string>(''); // 'uploading', 'ocr', 'done'
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      toast.error('Unsupported file format. Please upload PDF or image files.');
      return;
    }

    setUploading(true);
    setUploadStep('Uploading file...');
    setProgress(15);

    try {
      // Simulate network upload
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            clearInterval(interval);
            return 80;
          }
          return prev + 15;
        });
      }, 200);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', docType);
      formData.append('name', file.name);

      // Perform actual POST to our document route
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }

      setProgress(90);
      setUploadStep('AI Engine: Performing OCR & Field Extraction...');

      // Give 1 second for RAG/OCR AI simulation UI update
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setProgress(100);
      setUploadStep('Complete!');
      toast.success(`${file.name} successfully uploaded & processed!`);
      onUploadSuccess();

      // Reset state
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setUploadStep('');
      }, 1000);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'File upload failed');
      setUploading(false);
      setProgress(0);
      setUploadStep('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-card/40 border border-border/40 rounded-3xl p-6 relative">
      <h3 className="text-base font-semibold mb-4 text-foreground">Secure Upload Center</h3>

      {/* Select Document Type */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Select Document Type
        </label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          disabled={uploading}
          className="w-full text-sm rounded-xl border border-border bg-card/75 dark:bg-zinc-900/60 p-2.5 outline-none focus:border-primary transition-all text-foreground"
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Zone Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={uploading ? undefined : triggerFileInput}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-60 ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border/60 hover:border-primary/50 hover:bg-neutral-800/20 light:hover:bg-neutral-200/20'
        } ${uploading ? 'pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,image/*"
          onChange={handleChange}
        />

        {uploading ? (
          <div className="w-full text-center space-y-4">
            <div className="flex justify-center text-primary">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{uploadStep}</p>
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-border rounded-full h-1.5 max-w-xs mx-auto overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="flex justify-center text-muted-foreground/60">
              <UploadCloud className="h-12 w-12 text-primary/80" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Drag and drop your document here, or <span className="text-primary hover:underline">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Supports PDFs and high-resolution image scans up to 10MB</p>
            </div>
            <div className="inline-flex items-center space-x-1.5 text-xs text-muted-foreground/80 bg-neutral-900/40 dark:bg-black/20 border border-border/20 px-2.5 py-1 rounded-full">
              <FileText className="h-3.5 w-3.5" />
              <span>Auto-corrects detected fields using AI OCR</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
