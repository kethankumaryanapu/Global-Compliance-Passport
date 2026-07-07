'use client';

import { useState } from 'react';
import { useAuth, useTheme } from '@/context/AppContext';
import {
  Shield,
  Key,
  Bell,
  Sun,
  Moon,
  Lock,
  Eye,
  EyeOff,
  Code,
  Copy,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function StartupSettings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [digestAlerts, setDigestAlerts] = useState(false);

  // API keys state
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; created: string }[]>([
    { id: '1', name: 'Staging API Key', key: 'gcp_live_77112092_secret_x8s2l1', created: '2026-06-15' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    
    // In a real application, we would make a POST call to change the password
    toast.success('Account password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification preferences updated.');
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    const randomHex = Math.random().toString(16).substring(2, 8);
    const newKey = {
      id: Date.now().toString(),
      name: newKeyName.trim(),
      key: `gcp_live_${user?.companyId?.slice(0, 8) || 'key'}_secret_${randomHex}`,
      created: new Date().toISOString().split('T')[0]
    };
    
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    toast.success(`API Key '${newKey.name}' generated successfully.`);
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    toast.success('API Key revoked.');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API Key copied to clipboard.');
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Portal Settings</h1>
        <p className="text-xs text-muted-foreground font-medium">
          Manage security parameters, notification triggers, theme settings, and developer API keys
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Preferences */}
          <form
            onSubmit={handleSaveNotifications}
            className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4"
          >
            <h3 className="text-sm font-bold border-b border-border/40 pb-2 flex items-center text-foreground">
              <Bell className="h-4.5 w-4.5 mr-2 text-primary" />
              Compliance Alert Preferences
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/10 border border-border/10">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Email Notifications</p>
                  <p className="text-[10px] text-muted-foreground">Receive real-time email alerts for document verifications and access requests.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/10 border border-border/10">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Push Alerts</p>
                  <p className="text-[10px] text-muted-foreground">Enable in-app alerts and notifications in your browser tab.</p>
                </div>
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => setPushAlerts(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/10 border border-border/10">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Weekly Digest Summary</p>
                  <p className="text-[10px] text-muted-foreground">Receive a weekly summary report of your passport score, expiring files, and bank access logs.</p>
                </div>
                <input
                  type="checkbox"
                  checked={digestAlerts}
                  onChange={(e) => setDigestAlerts(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
            >
              Update Notification Settings
            </button>
          </form>

          {/* API developer keys */}
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold border-b border-border/40 pb-2 flex items-center text-foreground">
              <Code className="h-4.5 w-4.5 mr-2 text-primary" />
              Developer API Access Keys
            </h3>

            <form onSubmit={handleGenerateKey} className="flex gap-2">
              <input
                type="text"
                required
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Enter description name (e.g. Production Key)..."
                className="flex-1 text-xs rounded-xl border border-border bg-zinc-950/40 px-3.5 py-2 outline-none focus:border-primary text-foreground font-semibold"
              />
              <button
                type="submit"
                className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-foreground bg-secondary hover:bg-neutral-800/80 rounded-xl transition-colors border border-border/40"
              >
                Generate Key
              </button>
            </form>

            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/20 border border-border/20"
                >
                  <div className="space-y-1 min-w-0 pr-4">
                    <p className="text-xs font-bold text-foreground">{key.name}</p>
                    <p className="text-[10px] font-mono text-zinc-400 select-all truncate">{key.key}</p>
                    <span className="text-[8px] text-zinc-500 font-semibold">Created: {key.created}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="p-1.5 hover:text-primary hover:bg-neutral-800/40 rounded-lg text-muted-foreground transition-colors"
                      title="Copy Key"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-lg text-muted-foreground transition-colors"
                      title="Revoke Key"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Password Box & Theme Controls (Right Column) */}
        <div className="space-y-6">
          {/* Security Credentials */}
          <form
            onSubmit={handleChangePassword}
            className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4"
          >
            <h3 className="text-sm font-bold border-b border-border/40 pb-2 flex items-center text-foreground">
              <Key className="h-4.5 w-4.5 mr-2 text-primary" />
              Update Account Password
            </h3>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs rounded-xl border border-border bg-card p-2.5 pr-10 outline-none focus:border-primary text-foreground font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs rounded-xl border border-border bg-card p-2.5 outline-none focus:border-primary text-foreground font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-4 h-10 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
            >
              Update Password
            </button>
          </form>

          {/* Theme Display Preference */}
          <div className="bg-card/40 border border-border/40 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold border-b border-border/40 pb-2 flex items-center text-foreground">
              <Sun className="h-4.5 w-4.5 mr-2 text-primary" />
              Aesthetic Theme Preference
            </h3>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/10 border border-border/10 text-xs text-muted-foreground font-semibold">
              <span>Active Theme Mode: {theme.toUpperCase()}</span>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-card border border-border/40 hover:bg-neutral-800 text-foreground transition-all"
              >
                {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
