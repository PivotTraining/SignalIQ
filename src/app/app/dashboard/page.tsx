'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProspects } from '@/hooks/useProspects';
import { useSignals } from '@/hooks/useSignals';

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const { prospects, total, hotCount, refresh } = useProspects();
  const { signals, scan } = useSignals();

  useEffect(() => {
    refresh();
    scan();
  }, [refresh, scan]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-2 h-2 bg-gold rounded-full animate-pulse-dot" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="text-ink/60 mt-1">
          Here&apos;s your sales intelligence overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Prospects', value: total, color: 'text-ink' },
          { label: 'Hot Leads', value: hotCount, color: 'text-hot' },
          { label: 'Active Signals', value: signals.length, color: 'text-teal' },
          { label: 'Generations Used', value: `${profile?.gen_count ?? 0}`, color: 'text-gold' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card rounded-xl border border-rim/50 p-5"
          >
            <p className="text-sm text-ink/50">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Prospects */}
      <div className="bg-card rounded-xl border border-rim/50 p-6">
        <h2 className="font-display text-xl font-semibold mb-4">Recent Prospects</h2>
        {prospects.length === 0 ? (
          <p className="text-ink/40 text-sm">
            No prospects yet. Use the Signal Scanner or add prospects manually.
          </p>
        ) : (
          <div className="space-y-3">
            {prospects.slice(0, 5).map((prospect) => (
              <div
                key={prospect.id}
                className="flex items-center justify-between py-3 border-b border-rim/30 last:border-0"
              >
                <div>
                  <p className="font-medium">{prospect.name}</p>
                  <p className="text-sm text-ink/50">{prospect.company}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      prospect.signal_strength === 'hot'
                        ? 'bg-hot/10 text-hot'
                        : prospect.signal_strength === 'trigger'
                          ? 'bg-warm/10 text-warm'
                          : 'bg-teal/10 text-teal'
                    }`}
                  >
                    {prospect.signal_strength}
                  </span>
                  <span className="text-xs text-ink/40 capitalize">{prospect.stage}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
