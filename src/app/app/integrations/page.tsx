'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function IntegrationsPage() {
  const { profile, updateProfile, error } = useAuth();
  const [hunterKey, setHunterKey] = useState('');
  const [pdlKey, setPdlKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setHunterKey(profile.hunter_api_key ?? '');
      setPdlKey(profile.pdl_api_key ?? '');
    }
  }, [profile?.hunter_api_key, profile?.pdl_api_key]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateProfile({
      hunter_api_key: hunterKey || null,
      pdl_api_key: pdlKey || null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Integrations</h1>
      <p className="text-ink/60 text-sm mb-6">
        Connect your own API keys for enrichment. If left blank, SignalIQ uses the platform keys.
      </p>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-rim/50 p-6 space-y-6">
        {error && <div className="bg-hot/10 text-hot text-sm p-3 rounded-lg">{error}</div>}
        {saved && <div className="bg-fresh/10 text-fresh text-sm p-3 rounded-lg">Keys saved!</div>}

        {/* Hunter.io */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-warm/10 rounded-lg flex items-center justify-center text-warm text-sm font-bold">H</div>
            <div>
              <h3 className="font-medium text-sm">Hunter.io</h3>
              <p className="text-xs text-ink/40">Email finder — 25 free searches/month</p>
            </div>
          </div>
          <input
            type="password"
            value={hunterKey}
            onChange={(e) => setHunterKey(e.target.value)}
            placeholder="Your Hunter.io API key"
            className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm"
          />
        </div>

        {/* People Data Labs */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-teal/10 rounded-lg flex items-center justify-center text-teal text-sm font-bold">P</div>
            <div>
              <h3 className="font-medium text-sm">People Data Labs</h3>
              <p className="text-xs text-ink/40">Contact enrichment — 100 free enrichments/month</p>
            </div>
          </div>
          <input
            type="password"
            value={pdlKey}
            onChange={(e) => setPdlKey(e.target.value)}
            placeholder="Your PDL API key"
            className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-gold text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Keys'}
        </button>
      </form>

      {/* Connected services info */}
      <div className="mt-6 bg-card rounded-xl border border-rim/50 p-6">
        <h3 className="font-display text-lg font-semibold mb-3">Platform Services</h3>
        <p className="text-sm text-ink/60 mb-4">These are always connected through SignalIQ:</p>
        <div className="space-y-3">
          {[
            { name: 'Claude AI', desc: 'Intelligence briefs, email sequences, call scripts', status: 'Active' },
            { name: 'Stripe', desc: 'Subscription billing and plan management', status: 'Active' },
            { name: 'Google News', desc: 'Signal scanner (requires admin config)', status: 'Platform' },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between py-2 border-b border-rim/20 last:border-0">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-ink/40">{s.desc}</p>
              </div>
              <span className="text-xs bg-fresh/10 text-fresh px-2 py-1 rounded-full">{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
