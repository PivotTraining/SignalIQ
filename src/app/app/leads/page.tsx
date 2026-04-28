'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useProspects } from '@/hooks/useProspects';
import type { SignalStrength, ProspectStage, ProspectPriority } from '@/types/database';

/* ── Types ── */
interface DiscoveredContact {
  name: string;
  email: string | null;
  title: string | null;
  confidence: number;
  source: string;
}

interface CompanySuggestion {
  name: string;
  domain: string;
  logo: string;
}

/* ── Debounce hook ── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ── Priority Select ── */
const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-hot/10 text-hot border border-hot/20',
  medium: 'bg-warm/10 text-warm border border-warm/20',
  low: 'bg-teal/10 text-teal border border-teal/20',
};

function PrioritySelect({
  value,
  onChange,
}: {
  value: ProspectPriority;
  onChange: (v: ProspectPriority) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value as ProspectPriority) || null)}
      className={`text-xs rounded-full px-2 py-1 border-0 outline-none cursor-pointer font-medium appearance-none ${
        value ? PRIORITY_STYLES[value] : 'bg-rim/10 text-ink/30 border border-rim/20'
      }`}
      style={{ minWidth: 72 }}
    >
      <option value="">— None</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  );
}

/* ── Inline Notes Cell ── */
function NotesCell({
  prospectId,
  value,
  onSave,
}: {
  prospectId: string;
  value: string | null;
  onSave: (id: string, notes: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const open = () => {
    setDraft(value ?? '');
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const save = () => {
    const trimmed = draft.trim() || null;
    onSave(prospectId, trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
            if (e.key === 'Escape') cancel();
          }}
          rows={2}
          className="w-full rounded border border-gold/40 bg-surface px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-gold/50"
          placeholder="Add a note... (Enter to save, Esc to cancel)"
        />
        <div className="flex gap-2">
          <button onClick={save} className="text-[10px] text-gold hover:underline font-medium">Save</button>
          <button onClick={cancel} className="text-[10px] text-ink/40 hover:text-ink">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={open}
      className="group cursor-pointer min-h-[28px] max-w-[220px]"
      title={value ?? 'Click to add a note'}
    >
      {value ? (
        <p className="text-xs text-ink/70 leading-snug line-clamp-2 group-hover:text-ink transition-colors">
          {value}
        </p>
      ) : (
        <span className="text-xs text-ink/20 group-hover:text-ink/40 transition-colors italic">
          + note
        </span>
      )}
    </div>
  );
}

/* ── 3-Step Discovery Flow ── */
function DiscoverFlow({ onSaved }: { onSaved: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState('');
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [contacts, setContacts] = useState<DiscoveredContact[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    fetch(`/api/prospects/discover?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setSuggestions(data.suggestions ?? []); setShowSuggestions(true); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const pickCompany = async (suggestion: CompanySuggestion) => {
    setQuery(suggestion.name); setCompany(suggestion.name); setDomain(suggestion.domain);
    setShowSuggestions(false); setSuggestions([]);
    setSearching(true); setError(null); setContacts([]);
    try {
      const res = await fetch('/api/prospects/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: suggestion.name, domain: suggestion.domain }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Search failed'); return; }
      setContacts(data.contacts);
      setSelected(new Set(data.contacts.map((_: DiscoveredContact, i: number) => i)));
      setStep(2);
    } catch {
      setError('Search failed — check your connection');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) { await pickCompany(suggestions[0]); return; }
    if (!query.trim()) return;
    setError('Type a company name and pick from the dropdown.');
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    let count = 0;
    for (const idx of selected) {
      const contact = contacts[idx];
      if (!contact) continue;
      try {
        const res = await fetch('/api/prospects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: contact.name, company, title: contact.title, email: contact.email, signal_strength: 'warm' }),
        });
        if (res.ok) count++;
        else {
          const data = await res.json().catch(() => ({}));
          if (data.error && count === 0) setError(data.error);
        }
      } catch {
        if (count === 0) setError('Network error saving contacts');
      }
    }
    setSavedCount(count); setSaving(false); setStep(3); onSaved();
  };

  const handleReset = () => {
    setStep(1); setQuery(''); setCompany(''); setDomain('');
    setSuggestions([]); setContacts([]); setSelected(new Set()); setSavedCount(0); setError(null);
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  };

  return (
    <div className="bg-card rounded-xl border border-gold/30 p-6 mb-8">
      <div className="flex items-center gap-3 mb-5">
        {[{ n: 1, label: 'Search' }, { n: 2, label: 'Find' }, { n: 3, label: 'Save' }].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= n ? 'bg-gold text-white' : 'bg-rim/30 text-ink/40'}`}>
              {step > n ? '✓' : n}
            </div>
            <span className={`text-sm font-medium ${step >= n ? 'text-ink' : 'text-ink/40'}`}>{label}</span>
            {n < 3 && <div className={`w-8 h-0.5 ${step > n ? 'bg-gold' : 'bg-rim/30'}`} />}
          </div>
        ))}
      </div>

      {error && <div className="bg-hot/10 text-hot text-sm p-3 rounded-lg mb-4">{error}</div>}

      {step === 1 && (
        <form onSubmit={handleSearch} className="relative">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search any company — e.g. Salesforce, Nike, Stripe..."
                autoFocus
                className="w-full rounded-lg border-rim bg-surface px-4 py-3 text-sm focus:ring-gold focus:border-gold"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-rim/50 rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button key={s.domain} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickCompany(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-hover/50 transition-colors border-b border-rim/10 last:border-0">
                      {s.logo ? <img src={s.logo} alt="" className="w-6 h-6 rounded" /> : (
                        <div className="w-6 h-6 rounded bg-rim/20 flex items-center justify-center text-[10px] font-bold text-ink/40">{s.name.charAt(0)}</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-ink/40">{s.domain}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={searching || query.length < 2}
              className="bg-gold text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50 whitespace-nowrap">
              {searching ? 'Searching...' : 'Find Contacts'}
            </button>
          </div>
          {searching && <p className="text-xs text-ink/40 mt-2">Searching contacts at {domain || '...'}...</p>}
        </form>
      )}

      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-ink/60">Found <span className="font-semibold text-ink">{contacts.length}</span> contacts at <span className="font-semibold text-ink">{company}</span></p>
            <button onClick={handleReset} className="text-xs text-ink/40 hover:text-ink">Search again</button>
          </div>
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-ink/40">
              <p className="mb-2">No contacts found for this company.</p>
              <button onClick={handleReset} className="text-gold text-sm hover:underline">Try a different company</button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {contacts.map((c, i) => (
                  <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected.has(i) ? 'border-gold/50 bg-gold/5' : 'border-rim/30 hover:border-rim'}`}>
                    <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} className="rounded border-rim text-gold focus:ring-gold" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-ink/50 truncate">{c.title ?? 'No title'} {c.email && `· ${c.email}`}</p>
                    </div>
                    {c.confidence > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.confidence >= 80 ? 'bg-fresh/10 text-fresh' : c.confidence >= 50 ? 'bg-warm/10 text-warm' : 'bg-rim/20 text-ink/40'}`}>
                        {c.confidence}%
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <button onClick={handleSave} disabled={selected.size === 0 || saving}
                className="bg-gold text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50">
                {saving ? 'Saving...' : `Save ${selected.size} Contact${selected.size !== 1 ? 's' : ''} to Pipeline`}
              </button>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">✓</div>
          <p className="font-medium text-fresh">{savedCount} contact{savedCount !== 1 ? 's' : ''} added to your pipeline</p>
          <p className="text-sm text-ink/50 mt-1">Now generate outreach packages for them on the Generate tab.</p>
          <button onClick={handleReset} className="mt-4 text-gold text-sm hover:underline">Find more leads</button>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
const STAGES: ProspectStage[] = ['new', 'contacted', 'meeting', 'proposal', 'closed'];

export default function LeadsPage() {
  const { prospects, loading, error, refresh, create, updateStage, updateNotes, updatePriority, remove, filter } = useProspects();
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [strengthFilter, setStrengthFilter] = useState<string>('');

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    filter({
      search: search || undefined,
      stage: (stageFilter || undefined) as ProspectStage | undefined,
      strength: (strengthFilter || undefined) as SignalStrength | undefined,
    });
  }, [search, stageFilter, strengthFilter]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Leads</h1>
        <button onClick={() => setShowManualAdd(!showManualAdd)} className="text-sm text-ink/50 hover:text-ink">
          {showManualAdd ? 'Cancel' : '+ Add manually'}
        </button>
      </div>

      <DiscoverFlow onSaved={() => refresh()} />

      {showManualAdd && (
        <ManualAddForm
          onAdd={async (p) => { await create(p); setShowManualAdd(false); }}
          onClose={() => setShowManualAdd(false)}
        />
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <input placeholder="Search name, company, signal..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border-rim bg-card px-3 py-2 text-sm flex-1 min-w-[200px]" />
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
        <div className="text-center py-12 text-ink/40">
          <p className="text-sm">No prospects yet — use the search above to find your first leads.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-rim/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-lift border-b border-rim/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Name</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Company</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Signal</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Priority</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Stage</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Notes</th>
                <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} className="border-b border-rim/20 hover:bg-hover/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium whitespace-nowrap">{p.name}</p>
                    {p.email && <p className="text-xs text-ink/40 truncate max-w-[160px]">{p.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink/70 whitespace-nowrap">{p.company}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      p.signal_strength === 'hot' ? 'bg-hot/10 text-hot' : p.signal_strength === 'trigger' ? 'bg-warm/10 text-warm' : 'bg-teal/10 text-teal'
                    }`}>
                      {p.signal_strength}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PrioritySelect value={p.priority ?? null} onChange={(v) => updatePriority(p.id, v)} />
                  </td>
                  <td className="px-4 py-3">
                    <select value={p.stage} onChange={(e) => updateStage(p.id, e.target.value as ProspectStage)}
                      className="text-xs rounded border-rim bg-surface px-2 py-1">
                      {STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 min-w-[180px] max-w-[240px]">
                    <NotesCell prospectId={p.id} value={p.notes} onSave={(id, notes) => updateNotes(id, notes)} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => remove(p.id)} className="text-xs text-hot/60 hover:text-hot">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Manual Add Form ── */
function ManualAddForm({
  onAdd,
  onClose,
}: {
  onAdd: (p: { name: string; company: string; title?: string; email?: string; signal_strength?: SignalStrength }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onAdd({ name: name.trim(), company: company.trim(), title: title.trim() || undefined, email: email.trim() || undefined });
    } catch {
      setSubmitError('Failed to add contact. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}
      className="bg-card rounded-xl border border-rim/50 p-5 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
      {submitError && <div className="col-span-full bg-hot/10 text-hot text-xs p-2 rounded">{submitError}</div>}
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
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="bg-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50">
          {submitting ? 'Adding...' : 'Add'}
        </button>
        <button type="button" onClick={onClose} className="text-sm text-ink/40 hover:text-ink px-2">Cancel</button>
      </div>
    </form>
  );
}
