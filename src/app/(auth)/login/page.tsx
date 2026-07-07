'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';
import { Shield, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all credentials.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Trigger context login update which handles toasts and redirects
        login(data.token, data.user);
      } else {
        toast.error(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center radial-glow px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass p-8 rounded-3xl border border-border shadow-2xl relative">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        {/* Branding Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="bg-primary/25 p-2 rounded-xl border border-primary/30">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">GCP Identity</span>
            </Link>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Welcome back</h2>
          <p className="text-xs text-muted-foreground">
            Sign in to manage your reusable business credentials
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground uppercase">
              Corporate Email
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

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-semibold"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-sm rounded-xl border border-border bg-card/50 p-3 pl-10 outline-none focus:border-primary transition-all text-foreground"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 h-11 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-md shadow-primary/10 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Signing in...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Signup Prompt */}
        <div className="text-center pt-2 text-xs text-muted-foreground border-t border-border/40 mt-6 space-y-2">
          <div>
            New to GCP?{' '}
            <Link href="/signup" className="text-primary hover:underline font-semibold">
              Create an account
            </Link>
          </div>
          <div className="text-[10px] text-zinc-500 font-semibold pt-1 border-t border-border/10">
            System Administrator?{' '}
            <Link href="/admin/login" className="text-primary hover:underline font-bold">
              Access Admin Console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
