'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in as ADMIN, redirect to dashboard
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password fields are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        toast.success('Admin authorization granted! Redirecting...');
        await refreshUser();
        router.push('/admin/dashboard');
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Authentication failed.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative radial-glow px-4 md:px-6">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 h-32 w-32 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 h-32 w-32 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md bg-card/45 border border-border/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-primary/20 p-2.5 rounded-2xl border border-primary/30 mx-auto text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Global Compliance Passport</h1>
            <span className="text-[10px] text-primary uppercase font-bold tracking-wider flex items-center justify-center">
              <Sparkles className="h-3 w-3 mr-1" />
              Trusted Authority Console
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1 text-center">
          <h2 className="text-sm font-semibold text-muted-foreground">Welcome Back</h2>
          <p className="text-[11px] text-zinc-500">Sign in to review credentials and manage platform trust</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Email */}
          <div className="space-y-1">
            <label className="block text-[10px] text-zinc-500 uppercase font-semibold">Email address</label>
            <div className="flex bg-zinc-950/40 border border-border rounded-xl px-3 py-2.5 items-center gap-2.5 focus-within:border-primary transition-all">
              <Mail className="h-4 w-4 text-zinc-500 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gcp.com"
                className="bg-transparent outline-none text-foreground w-full text-xs"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-[10px] text-zinc-500 uppercase font-semibold">Security Password</label>
            <div className="flex bg-zinc-950/40 border border-border rounded-xl px-3 py-2.5 items-center gap-2.5 focus-within:border-primary transition-all">
              <Lock className="h-4 w-4 text-zinc-500 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent outline-none text-foreground w-full text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-500 hover:text-foreground transition-colors shrink-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between text-[11px]">
            <label className="flex items-center space-x-2 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary bg-zinc-950/40"
              />
              <span>Remember Me</span>
            </label>
            <button
              type="button"
              onClick={() => toast.info('Administrative credential reset requires authority verification key.')}
              className="text-primary hover:underline font-semibold"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 h-11 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-md shadow-primary/10 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Access Administration Console'
            )}
          </button>
        </form>

        {/* Demo Notice */}
        <div className="bg-primary/5 border border-primary/20 p-3 rounded-2xl text-[10px] text-center text-zinc-400 space-y-1">
          <p className="font-bold text-primary">Demo Admin Credentials</p>
          <p>Email: <span className="text-foreground font-mono">admin@gcp.com</span></p>
          <p>Password: <span className="text-foreground font-mono">admin123</span></p>
        </div>
      </div>
    </div>
  );
}
