'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Verify() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      toast.error('Verification code must be a 6-digit number.');
      return;
    }

    setLoading(true);

    // Simulate verification checking
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
      toast.success('Email verification completed successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center radial-glow px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass p-8 rounded-3xl border border-border shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="bg-primary/25 p-2 rounded-xl border border-primary/30">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">GCP Identity</span>
            </Link>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Verify your email</h2>
          <p className="text-xs text-muted-foreground">
            We have sent a 6-digit confirmation code to your registered email address
          </p>
        </div>

        {verified ? (
          <div className="text-center space-y-4 py-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Verification Complete</p>
              <p className="text-xs text-muted-foreground">
                Your email has been verified. Redirecting to login page...
              </p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5 text-center">
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                Enter Verification Code
              </label>
              <div className="relative max-w-[220px] mx-auto">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] text-base font-bold rounded-xl border border-border bg-card/50 p-3 pl-10 outline-none focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 h-11 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-md shadow-primary/10 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Confirming code...
                </>
              ) : (
                <>
                  Verify Code
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 text-xs text-muted-foreground border-t border-border/40 mt-6">
              Didn't receive a code?{' '}
              <button
                type="button"
                onClick={() => toast.success('A new verification code has been sent!')}
                className="text-primary hover:underline font-semibold"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
