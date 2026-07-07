'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';
import {
  Building,
  MapPin,
  Mail,
  Phone,
  User,
  Plus,
  Trash2,
  Globe,
  Tag,
  ShieldCheck,
  FileText,
  Upload,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';

export default function StartupProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Editable fields
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [isEditing, setIsEditing] = useState(false);

  // Directors list (persisted in localStorage for convenience since there's no DB table)
  const [directors, setDirectors] = useState<string[]>([]);
  const [newDirector, setNewDirector] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/startup/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setIndustry(data.profile.industry);
        setCountry(data.profile.country);
        setAddress(data.profile.address);
        setLogo(data.profile.logo);
        setPhone(data.profile.contactInfo.phone);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      // Initialize directors from local storage
      const savedDirs = localStorage.getItem(`dirs_${user.companyId}`);
      if (savedDirs) {
        setDirectors(JSON.parse(savedDirs));
      } else {
        const defaultDirs = ['John Doe (Founder & CEO)', 'Jane Smith (Co-Founder & CTO)'];
        setDirectors(defaultDirs);
        localStorage.setItem(`dirs_${user.companyId}`, JSON.stringify(defaultDirs));
      }
    }
  }, [user]);

  const handleAddDirector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirector.trim()) return;
    const updated = [...directors, newDirector.trim()];
    setDirectors(updated);
    localStorage.setItem(`dirs_${user?.companyId}`, JSON.stringify(updated));
    setNewDirector('');
    toast.success('Board Director added to registry.');
  };

  const handleDeleteDirector = (idx: number) => {
    const updated = directors.filter((_, i) => i !== idx);
    setDirectors(updated);
    localStorage.setItem(`dirs_${user?.companyId}`, JSON.stringify(updated));
    toast.success('Director removed.');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/startup/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          country,
          address,
          logo,
        }),
      });

      if (response.ok) {
        toast.success('Company registry updated successfully!');
        setIsEditing(false);
        fetchProfile();
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Update failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-border/40 w-1/4 rounded-xl" />
        <div className="h-64 bg-border/40 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Company Profile</h1>
        <p className="text-xs text-muted-foreground font-medium">
          Manage your verified corporation details, board structure, and registration keys
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Visual identity summary card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

            {/* Logo box */}
            <div className="h-20 w-20 rounded-3xl bg-neutral-900 border border-border/40 flex items-center justify-center relative group overflow-hidden mb-4">
              {logo ? (
                <img src={logo} alt="Company Logo" className="object-cover h-full w-full" />
              ) : (
                <Building className="h-10 w-10 text-primary" />
              )}
            </div>

            <h3 className="text-base font-extrabold text-foreground">{profile?.name}</h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{profile?.regNumber}</p>

            <div className="mt-4 flex items-center justify-center space-x-2.5">
              <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {profile?.industry}
              </span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Score: {profile?.complianceScore}%
              </span>
            </div>

            <div className="w-full border-t border-border/20 mt-6 pt-5 space-y-2.5 text-left text-xs text-muted-foreground font-semibold">
              <p className="flex items-center">
                <Globe className="h-4 w-4 mr-2.5 text-zinc-500" />
                Country: {profile?.country}
              </p>
              <p className="flex items-start">
                <MapPin className="h-4 w-4 mr-2.5 text-zinc-500 mt-0.5" />
                <span className="leading-tight">{profile?.address}</span>
              </p>
            </div>
          </div>

          {/* Registry Keys summary */}
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border/25 pb-2">
              Extracted Compliance Keys
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="bg-zinc-950/20 p-3 rounded-2xl border border-border/20">
                <span className="text-[10px] text-zinc-500 font-semibold block uppercase">GSTIN (India)</span>
                <span className="font-mono font-bold text-foreground mt-0.5 block">{profile?.gstin}</span>
              </div>
              <div className="bg-zinc-950/20 p-3 rounded-2xl border border-border/20">
                <span className="text-[10px] text-zinc-500 font-semibold block uppercase">PAN (India)</span>
                <span className="font-mono font-bold text-foreground mt-0.5 block">{profile?.pan}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Directors list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editor Form */}
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6">
            <div className="flex justify-between items-center border-b border-border/40 pb-3 mb-5">
              <h3 className="text-base font-semibold text-foreground flex items-center">
                <Building className="h-4.5 w-4.5 text-primary mr-2" />
                Company Registry Editor
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center text-xs text-primary font-bold hover:underline"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Company Registered Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile?.name || ''}
                    className="w-full text-xs rounded-xl border border-border bg-zinc-950/20 p-2.5 outline-none text-muted-foreground font-semibold"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Registry Identifier (CIN / EIN)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile?.regNumber || ''}
                    className="w-full text-xs rounded-xl border border-border bg-zinc-950/20 p-2.5 outline-none text-muted-foreground font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Industry Verticals
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Fintech / SaaS"
                    className={`w-full text-xs rounded-xl border p-2.5 outline-none text-foreground font-semibold ${
                      isEditing ? 'bg-card/60 border-border focus:border-primary' : 'bg-zinc-950/20 border-border/20'
                    }`}
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Country Jurisdiction
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={`w-full text-xs rounded-xl border p-2.5 outline-none text-foreground font-semibold ${
                      isEditing ? 'bg-card/60 border-border focus:border-primary' : 'bg-zinc-950/20 border-border/20'
                    }`}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Logo Image URL
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={`w-full text-xs rounded-xl border p-2.5 outline-none text-foreground font-mono ${
                      isEditing ? 'bg-card/60 border-border focus:border-primary' : 'bg-zinc-950/20 border-border/20'
                    }`}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Registered Headquarters Address
                  </label>
                  <textarea
                    required
                    disabled={!isEditing}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className={`w-full text-xs rounded-xl border p-2.5 outline-none text-foreground leading-relaxed ${
                      isEditing ? 'bg-card/60 border-border focus:border-primary' : 'bg-zinc-950/20 border-border/20'
                    }`}
                  />
                </div>

                {/* Contact details */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Primary Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      disabled
                      value={profile?.contactInfo.email || ''}
                      className="w-full text-xs rounded-xl border border-border/20 bg-zinc-950/20 p-2.5 pl-10 outline-none text-muted-foreground font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">
                    Registry Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full text-xs rounded-xl border p-2.5 pl-10 outline-none text-foreground font-semibold ${
                        isEditing ? 'bg-card/60 border-border focus:border-primary' : 'bg-zinc-950/20 border-border/20'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm mt-2"
                >
                  Save Profile Changes
                </button>
              )}
            </form>
          </div>

          {/* Directors list board */}
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-semibold border-b border-border/40 pb-2 flex items-center">
              <User className="h-4.5 w-4.5 mr-2 text-primary" />
              Board of Directors (Registry KYC)
            </h3>

            <form onSubmit={handleAddDirector} className="flex gap-2">
              <input
                type="text"
                required
                value={newDirector}
                onChange={(e) => setNewDirector(e.target.value)}
                placeholder="Enter full name and title of director..."
                className="flex-1 text-xs rounded-xl border border-border/40 bg-zinc-950/40 px-3.5 py-2 outline-none focus:border-primary text-foreground font-semibold"
              />
              <button
                type="submit"
                className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-foreground bg-secondary hover:bg-neutral-800/80 rounded-xl transition-colors border border-border/40"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {directors.length === 0 ? (
                <p className="text-muted-foreground italic text-xs text-center py-4">No directors listed.</p>
              ) : (
                directors.map((dir, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-2xl bg-zinc-900/20 border border-border/20"
                  >
                    <span className="text-xs font-semibold text-foreground">{dir}</span>
                    <button
                      onClick={() => handleDeleteDirector(idx)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
