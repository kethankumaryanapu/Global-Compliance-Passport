'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';
import PassportQR from '@/components/PassportQR';
import { Award, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function StartupPassport() {
  const { user } = useAuth();
  const [passport, setPassport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPassport = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/passport');
      if (res.ok) {
        const data = await res.json();
        setPassport(data.passport || null);
      }
    } catch (error) {
      console.error('Failed to load passport:', error);
      toast.error('Could not retrieve Compliance Passport details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPassport();
    }
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Compliance Passport</h1>
        <p className="text-xs text-muted-foreground">
          Your reusable digital business identity signed dynamically by Trusted Compliance Authorities
        </p>
      </div>

      {loading ? (
        <div className="h-80 bg-card/45 border border-border/40 rounded-3xl animate-pulse" />
      ) : passport ? (
        <div className="max-w-3xl">
          <PassportQR passport={passport} />
        </div>
      ) : (
        <div className="bg-card/40 border border-border/40 rounded-3xl p-12 text-center space-y-4">
          <Award className="h-16 w-16 text-muted-foreground/30 mx-auto animate-float" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Compliance Passport Offline</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              We require verified credentials to compile your active Compliance Passport.
              Please upload your core files (GST, PAN, or Certificate of Incorporation) and wait for verification review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
