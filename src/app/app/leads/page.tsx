'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useProspects } from '@/hooks/useProspects';
import type { SignalStrength, ProspectStage } from '@/types/database';

function AddProspectModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (p: { name: string; company: string; title?: string; email?: string; industry?: string; signal_text?: string; signal_strength?: SignalStrength }) => void;
}) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [signalText, setSignalText] = useState('');
  const [strength, setStrength] = useState<SignalStrength>('warm');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      company,
      title: title || undefined,
      email: email || undefined,
      industry: industry || undefined,
      signal_text: signalText || undefined,
      signal_strength: strength,
    });
  };

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-rim/50 p-6 w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg font-semibold">Add Prospect</h3>
          <button type="button" onClick={onClose} className="text-ink/40 hover:text-ink text-xl">&times;</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Company *</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} required className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Industry</label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Signal Strength</label>
            <select value={strength} onChange={(e) => setStrength(e.target.value as SignalStrength)} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm">
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="trigger">Trigger</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Buying Signal</label>
          <textarea value={signalText} onChange={(e) => setSignalText(e.target.value)} rows={2} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink/60 hover:text-ink">Cancel</button>
          <button type="submit" className="bg-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold/90">Add Prospect</button>
        </div>
      </form>
    </div>
  );
}

const STAGES: ProspectStage[] = ['new', 'contacted', 'meeting', 'proposal', 'closed'];

export default function LeadsPage() {
  const { prospects, loading, error, refresh, create, updateStage, remove, filter } = useProspects();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [strengthFilter, setStrengthFilter] = useState<string>('');

  useEffect(() => { refresh(); }, [refresh]);

  const handleFilter = () => {
    filter({
      search: search || undefined,
      stage: (stageFilter || undefined) as ProspectStage | undefined,
      strength: (strengthFilter || undefined) as SignalStrength | undefined,
    });
  };

  useEffect(() => { handleFilter(); }, [search, stageFilter, strengthFilter]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Leads</h1>
        <button onClick={() => setShowAdd(true)} className="bg-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold/90">
          + Add Prospect
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          placeholder="Search name, company, signal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border-rim bg-card px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="rounded-lg border-rim bg-card px-3 py-2 text-sm">
          <option value="">All Stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={strengthFilter} onChange={(e) => setStrengthFilter(e.target.value)} className="rounded-lg border-rim bg-card px-3 py-2 text-sm">
          <option value="">All Signals</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="trigger">Trigger</option>
        </select>
      </div>

      {error && <div className="bg-hot/10 text-hot text-sm p-3 rounded-lg mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-ink/40">Loading prospects...</div>
      ) : prospects.length === 0 ? (
        <div className="text-center py-20 text-ink/40">
          <p className="text-lg mb-2">No prospects yet</p>
          <p className="text-sm">Add your first prospect or use the Signal Scanner to find leads.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-rim/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-lift border-b border-rim/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Signal</th>
                <th className="text-left px-4 py-3 font-medium">Stage</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} className="border-b border-rim/20 hover:bg-hover/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    {p.email && <p className="text-xs text-ink/40">{p.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{p.company}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.signal_strength === 'hot' ? 'bg-hot/10 text-hot'
                        : p.signal_strength === 'trigger' ? 'bg-warm/10 text-warm'
                        : 'bg-teal/10 text-teal'
                    }`}>
                      {p.signal_strength}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.stage}
                      onChange={(e) => updateStage(p.id, e.target.value as ProspectStage)}
                      className="text-xs rounded border-rim bg-surface px-2 py-1"
                    >
                      {STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(p.id)} className="text-xs text-hot/60 hover:text-hot">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddProspectModal
          onClose={() => setShowAdd(false)}
          onAdd={async (p) => {
            await create(p);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}
