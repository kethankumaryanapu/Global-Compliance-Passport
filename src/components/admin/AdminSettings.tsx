'use client';

import { useState } from 'react';
import { Sliders, Lock, Cpu, Sparkles, Bell, Key, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminProfile from './AdminProfile';

export default function AdminSettings() {
  const [ocrThreshold, setOcrThreshold] = useState(85);
  const [aiEngine, setAiEngine] = useState('gpt-4o-mini');
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [apiToken, setApiToken] = useState('gcp_live_e3f9a2b8e7c10d51');

  const handleGenerateNewKey = () => {
    const chars = 'abcdef0123456789';
    let token = 'gcp_live_';
    for (let i = 0; i < 16; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    setApiToken(token);
    toast.success('Generated a new administrative API Token');
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Administrative system configurations successfully updated!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Admin Profile Identity and Password Forms */}
      <AdminProfile />

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Configuration Settings (Left columns) */}
      <form onSubmit={handleSaveConfig} className="lg:col-span-2 bg-card/40 border border-border/40 rounded-3xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-foreground flex items-center">
          <Cpu className="h-4.5 w-4.5 text-primary mr-2" />
          OCR & AI Models Pipeline Configuration
        </h3>

        <div className="space-y-4 text-xs">
          {/* Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-400">Minimum AI OCR Confidence Threshold</span>
              <span className="font-extrabold text-primary font-mono">{ocrThreshold}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              OCR uploads parsing below this threshold will automatically flag "Manual Review Required" warnings.
            </p>
            <input
              type="range"
              min="50"
              max="99"
              value={ocrThreshold}
              onChange={(e) => setOcrThreshold(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Engine model */}
          <div className="space-y-2 border-t border-border/20 pt-4">
            <span className="font-semibold text-zinc-400">Dynamic Text Extractor LLM</span>
            <p className="text-[10px] text-muted-foreground">
              Select the parsing engine for scanning company registries and extracting key-value attributes.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-1.5-pro'].map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => setAiEngine(model)}
                  className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${
                    aiEngine === model
                      ? 'border-primary/50 text-foreground bg-primary/10'
                      : 'border-border/40 text-muted-foreground bg-transparent'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications toggles */}
          <div className="space-y-3.5 border-t border-border/20 pt-4">
            <span className="font-semibold text-zinc-400">System Notification Triggers</span>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground">Immediate Startup Alerts</span>
                  <p className="text-[10px] text-muted-foreground">Notify when a new startup registers or uploads files.</p>
                </div>
                <input
                  type="checkbox"
                  checked={systemAlerts}
                  onChange={(e) => setSystemAlerts(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4.5 h-4.5 bg-zinc-950"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center px-4 h-9 text-xs font-bold text-white bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
          >
            Save Pipeline Changes
          </button>
        </div>
      </form>

      {/* API credentials & info (Right column) */}
      <div className="lg:col-span-1 bg-card/40 border border-border/40 rounded-3xl p-6 space-y-5">
        <div className="pb-2 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">API Credentials</h3>
          <Key className="h-4.5 w-4.5 text-primary" />
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Use this master token to call Global Compliance Passport checking functions inside external workflows.
          </p>

          <div className="space-y-2">
            <div className="bg-zinc-950/45 p-3 rounded-2xl font-mono text-[10px] flex justify-between items-center border border-border/30">
              <span className="text-foreground select-all">{apiToken}</span>
              <button
                onClick={handleGenerateNewKey}
                className="p-1 hover:text-primary transition-colors text-muted-foreground"
                title="Rotate API Token"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-2xl space-y-1">
            <span className="text-[9px] uppercase font-bold text-primary flex items-center">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              System Status
            </span>
            <p className="text-muted-foreground text-[10px] leading-relaxed">
              All compliance databases (SQLite) and OCR parsing workers are operating at high thresholds.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
