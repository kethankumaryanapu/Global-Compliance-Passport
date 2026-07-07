'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, User, Building, Landmark, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Signup() {
  const router = useRouter();
  const [role, setRole] = useState<'STARTUP' | 'INSTITUTION'>('STARTUP');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Startup Specifics
  const [companyName, setCompanyName] = useState('');
  const [regNumber, setRegNumber] = useState('');

  // Institution Specifics
  const [institutionName, setInstitutionName] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('Please fill in all core credentials.');
      return;
    }

    if (role === 'STARTUP' && (!companyName || !regNumber)) {
      toast.error('Please fill in all company registration details.');
      return;
    }

    if (role === 'INSTITUTION' && !institutionName) {
      toast.error('Please specify your institution name.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          companyName: role === 'STARTUP' ? companyName : undefined,
          regNumber: role === 'STARTUP' ? regNumber : undefined,
          institutionName: role === 'INSTITUTION' ? institutionName : undefined,
          description: role === 'INSTITUTION' ? description : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Registration successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        toast.error(data.message || 'Signup failed.');
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
        <div className="absolute top-0 left-0 -mt-8 -ml-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

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
          <h2 className="text-2xl font-extrabold text-foreground">Create your account</h2>
          <p className="text-xs text-muted-foreground">
            Get started with your digital reusable compliance identity
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-neutral-900/60 light:bg-neutral-200/50 border border-border rounded-xl">
          <button
            type="button"
            onClick={() => setRole('STARTUP')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              role === 'STARTUP'
                ? 'bg-card text-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Startup</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('INSTITUTION')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              role === 'INSTITUTION'
                ? 'bg-card text-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Landmark className="h-3.5 w-3.5" />
            <span>Institution</span>
          </button>
        </div>

        {/* Signup Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* User Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground uppercase">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full text-sm rounded-xl border border-border bg-card/50 p-3 pl-10 outline-none focus:border-primary transition-all text-foreground"
              />
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-muted-foreground uppercase">
              Create Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full text-sm rounded-xl border border-border bg-card/50 p-3 pl-10 outline-none focus:border-primary transition-all text-foreground"
              />
            </div>
          </div>

          {/* STARTUP FIELDS */}
          {role === 'STARTUP' && (
            <div className="space-y-4 border-t border-border/40 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Registered Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Compliance Labs Pvt Ltd"
                    className="w-full text-sm rounded-xl border border-border bg-card/50 p-3 pl-10 outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Corporate Registration Number (CIN / UEN / EIN)
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="U72900MH2024PTC987654"
                    className="w-full text-sm rounded-xl border border-border bg-card/50 p-3 pl-10 outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* INSTITUTION FIELDS */}
          {role === 'INSTITUTION' && (
            <div className="space-y-4 border-t border-border/40 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Institution Name
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="HDFC Bank Compliance Dept"
                    className="w-full text-sm rounded-xl border border-border bg-card/50 p-3 pl-10 outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Short Description / Scope
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Venture Capital Investment Firm / Banking KYC"
                  className="w-full text-sm rounded-xl border border-border bg-card/50 p-3 outline-none focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>
          )}

          {/* Submit Onboarding */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 h-11 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-md shadow-primary/10 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Registering Account...
              </>
            ) : (
              <>
                Complete Onboarding
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Login Prompt */}
        <div className="text-center pt-2 text-xs text-muted-foreground border-t border-border/40 mt-6 space-y-2">
          <div>
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Log in
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
