'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulate password recovery trigger
    toast.success('Recovery link dispatched successfully.');
    setSubmitted(true);
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
          <h2 className="text-2xl font-extrabold text-foreground">Reset password</h2>
          <p className="text-xs text-muted-foreground">
            We will send a cryptographic recovery link to your corporate email address
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4 py-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Check your inbox</p>
              <p className="text-xs text-muted-foreground">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full px-4 h-11 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-md shadow-primary/10"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@mystartup.com"
                  className="w-full text-sm rounded-xl border border-border bg-card/50 p-3 pl-10 outline-none focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-4 h-11 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-md shadow-primary/10 mt-2"
            >
              Send Reset Instructions
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>

            <div className="text-center pt-2 text-xs text-muted-foreground border-t border-border/40 mt-6">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
