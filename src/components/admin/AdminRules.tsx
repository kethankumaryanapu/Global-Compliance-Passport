'use client';

import { useState } from 'react';
import { Sliders, Plus, Edit3, Trash2, Globe, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface AdminRulesProps {
  rules: any[];
  onActionComplete: () => void;
}

export default function AdminRules({ rules, onActionComplete }: AdminRulesProps) {
  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [country, setCountry] = useState('');
  const [regulatoryBody, setRegulatoryBody] = useState('');
  const [description, setDescription] = useState('');
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [estimatedTimeline, setEstimatedTimeline] = useState('');
  const [docTypeInput, setDocTypeInput] = useState('');

  const handleEditClick = (rule: any) => {
    let parsedRules: any = {};
    try {
      parsedRules = JSON.parse(rule.rules || '{}');
    } catch (e) {
      parsedRules = {};
    }

    setSelectedRule(rule);
    setCountry(rule.country);
    setRegulatoryBody(parsedRules.regulatoryBody || '');
    setDescription(parsedRules.description || '');
    setRequiredDocs(parsedRules.requiredDocuments || []);
    setEstimatedTimeline(parsedRules.estimatedTimeline || '');
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreateClick = () => {
    setSelectedRule(null);
    setCountry('');
    setRegulatoryBody('');
    setDescription('');
    setRequiredDocs(['INCORPORATION', 'PAN']);
    setEstimatedTimeline('');
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleAddDocType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTypeInput.trim()) return;
    const cleanType = docTypeInput.trim().toUpperCase();
    if (!requiredDocs.includes(cleanType)) {
      setRequiredDocs((prev) => [...prev, cleanType]);
    }
    setDocTypeInput('');
  };

  const handleRemoveDocType = (type: string) => {
    setRequiredDocs((prev) => prev.filter((t) => t !== type));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rulesObject = {
      requiredDocuments: requiredDocs,
      regulatoryBody,
      description,
      estimatedTimeline,
      guidelines: requiredDocs.reduce((acc: any, type) => {
        acc[type] = `Mandatory verified filing for ${type} certificate.`;
        return acc;
      }, {}),
    };

    try {
      const payload: any = {
        country,
        rules: JSON.stringify(rulesObject),
      };

      if (isEditing && selectedRule) {
        payload.ruleId = selectedRule.id;
      }

      const res = await fetch('/api/admin/rules', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Compliance rules successfully saved!`);
        setIsEditing(false);
        setIsCreating(false);
        setSelectedRule(null);
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Saving rules failed.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save rulesets.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this country compliance ruleset?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/rules?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Ruleset deleted successfully');
        setIsEditing(false);
        setIsCreating(false);
        setSelectedRule(null);
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Delete failed.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete rules.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-300">
      {/* Countries list (Left Columns) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center bg-card/40 border border-border/40 p-4 rounded-3xl">
          <span className="text-xs font-bold text-muted-foreground uppercase">Supported Countries Registry</span>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center px-3.5 h-8 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Country
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((item) => {
            let config: any = {};
            try {
              config = JSON.parse(item.rules || '{}');
            } catch (e) {
              config = {};
            }

            return (
              <div
                key={item.id}
                onClick={() => handleEditClick(item)}
                className={`bg-card/40 border rounded-3xl p-5 space-y-4 cursor-pointer hover:border-primary/45 transition-all ${
                  selectedRule?.id === item.id ? 'border-primary' : 'border-border/40'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2.5">
                    <Globe className="h-4.5 w-4.5 text-primary" />
                    <h4 className="text-sm font-bold text-foreground">{item.country}</h4>
                  </div>
                  <Edit3 className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-foreground" />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {config.description || 'No description seeded.'}
                </p>

                <div className="flex flex-wrap gap-1">
                  {(config.requiredDocuments || []).map((doc: string) => (
                    <span
                      key={doc}
                      className="bg-zinc-900/60 border border-border/40 px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-400 uppercase font-mono"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Form (Right Column) */}
      {(isEditing || isCreating) ? (
        <form
          onSubmit={handleSubmit}
          className="bg-card/40 border border-primary/30 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300 lg:col-span-1"
        >
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h3 className="text-sm font-bold text-foreground">
              {isEditing ? 'Edit country Rules' : 'Create Compliance ruleset'}
            </h3>
            {isEditing && (
              <button
                type="button"
                onClick={() => handleDelete(selectedRule.id)}
                className="text-rose-500 hover:text-rose-600 transition-colors"
                title="Delete rules"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Country */}
            <div className="space-y-1">
              <label className="block text-[9px] text-zinc-500 uppercase font-semibold">Target Country</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Germany, UK"
                disabled={isEditing}
                className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground disabled:opacity-50"
              />
            </div>

            {/* Regulatory Body */}
            <div className="space-y-1">
              <label className="block text-[9px] text-zinc-500 uppercase font-semibold">Regulatory Authority</label>
              <input
                type="text"
                required
                value={regulatoryBody}
                onChange={(e) => setRegulatoryBody(e.target.value)}
                placeholder="e.g. ACRA, SEC, BaFin"
                className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-[9px] text-zinc-500 uppercase font-semibold">Rules Overview</label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of local compliance laws..."
                className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground"
              />
            </div>

            {/* Estimated timeline */}
            <div className="space-y-1">
              <label className="block text-[9px] text-zinc-500 uppercase font-semibold">Avg Approval Timeline</label>
              <input
                type="text"
                required
                value={estimatedTimeline}
                onChange={(e) => setEstimatedTimeline(e.target.value)}
                placeholder="e.g. 5-10 business days"
                className="w-full text-xs rounded-xl border border-border bg-zinc-950/40 p-2.5 outline-none focus:border-primary text-foreground"
              />
            </div>

            {/* Required doc types tag field */}
            <div className="space-y-2 border-t border-border/20 pt-3">
              <label className="block text-[9px] text-zinc-500 uppercase font-semibold">Required Filing Items</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {requiredDocs.map((type) => (
                  <span
                    key={type}
                    onClick={() => handleRemoveDocType(type)}
                    className="cursor-pointer bg-zinc-900/80 border border-border/40 hover:border-rose-500/40 hover:text-rose-400 px-2 py-0.5 rounded text-[8px] font-bold text-zinc-400 uppercase font-mono"
                  >
                    {type} ✕
                  </span>
                ))}
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={docTypeInput}
                  onChange={(e) => setDocTypeInput(e.target.value)}
                  placeholder="Add type e.g. TAX_ID"
                  className="flex-1 text-xs rounded-xl border border-border bg-zinc-950/40 px-2.5 py-1.5 outline-none focus:border-primary text-foreground"
                />
                <button
                  type="button"
                  onClick={handleAddDocType}
                  className="px-3 h-8 bg-zinc-800 text-[10px] font-bold hover:bg-neutral-700/80 border border-border rounded-xl transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-2 border-t border-border/20 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setIsCreating(false);
                  setSelectedRule(null);
                }}
                className="flex-1 h-9 text-xs font-bold border border-border text-muted-foreground hover:text-foreground bg-transparent rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-9 text-xs font-bold text-white bg-primary hover:bg-primary/95 rounded-xl transition-all shadow-sm"
              >
                Save rules
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-card/20 border border-dashed border-border/60 rounded-3xl p-8 text-center space-y-3 text-xs text-muted-foreground lg:col-span-1">
          <Sliders className="h-8 w-8 mx-auto text-muted-foreground/30" />
          <p>Select a country ruleset to modify file requirements, guidelines, and timelines, or add new ones.</p>
        </div>
      )}
    </div>
  );
}
