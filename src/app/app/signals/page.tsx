'use client';

import { useEffect } from 'react';
import { useSignals } from '@/hooks/useSignals';

export default function SignalsPage() {
  const { signals, loading, error, source, scan, dismiss, markConverted } = useSignals();

  useEffect(() => { scan(); }, [scan]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Signals</h1>
          <p className="text-ink/60 text-sm mt-1">
            Real-time buying signals detected across your target industries.
            {source && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal">{source}</span>}
          </p>
        </div>
        <button
          onClick={scan}
          disabled={loading}
          className="bg-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50"
        >
          {loading ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      {error && <div className="bg-hot/10 text-hot text-sm p-3 rounded-lg mb-4">{error}</div>}

      {!loading && signals.length === 0 ? (
        <div className="text-center py-20 text-ink/40">
          <p className="text-lg mb-2">No signals detected</p>
          <p className="text-sm">Configure your target industries in your profile, then scan again.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className={`bg-card rounded-xl border border-rim/50 p-5 ${signal.converted ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      signal.signal_type === 'hot' ? 'bg-hot/10 text-hot'
                        : signal.signal_type === 'trigger' ? 'bg-warm/10 text-warm'
                        : 'bg-teal/10 text-teal'
                    }`}>
                      {signal.signal_type}
                    </span>
                    <span className="text-xs text-ink/30">Score: {signal.score}</span>
                    {signal.converted && <span className="text-xs text-fresh">Converted</span>}
                  </div>
                  <h3 className="font-medium text-sm">{signal.title}</h3>
                  {signal.snippet && (
                    <p className="text-xs text-ink/50 mt-1 line-clamp-2">{signal.snippet}</p>
                  )}
                  <a
                    href={signal.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:underline mt-2 inline-block"
                  >
                    View source &rarr;
                  </a>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!signal.converted && (
                    <button
                      onClick={() => markConverted(signal.id)}
                      className="text-xs bg-fresh/10 text-fresh px-3 py-1.5 rounded-lg hover:bg-fresh/20"
                    >
                      Convert
                    </button>
                  )}
                  <button
                    onClick={() => dismiss(signal.id)}
                    className="text-xs text-ink/40 px-3 py-1.5 rounded-lg hover:bg-hover"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-ink/40">
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse-dot" />
          <span className="text-sm">Scanning for signals...</span>
        </div>
      )}
    </div>
  );
}
