'use client';

import { useCallback, useState } from 'react';
import type { Signal } from '@/types/database';

export function useSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'cache' | null>(null);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/signals/scan');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to scan signals');
        return;
      }

      setSignals(data.signals);
      setSource(data.source);
    } catch {
      setError('Failed to scan signals');
    } finally {
      setLoading(false);
    }
  }, []);

  const dismiss = async (id: string) => {
    // Optimistic removal
    const previous = signals;
    setSignals((prev) => prev.filter((s) => s.id !== id));

    try {
      const res = await fetch('/api/signals/scan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'dismiss' }),
      });

      if (!res.ok) {
        setSignals(previous);
      }
    } catch {
      setSignals(previous);
    }
  };

  const markConverted = async (id: string) => {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, converted: true } : s))
    );

    try {
      await fetch('/api/signals/scan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'convert' }),
      });
    } catch {
      // Conversion flag is non-critical, silent fail is acceptable
    }
  };

  return {
    signals,
    loading,
    error,
    source,
    scan,
    dismiss,
    markConverted,
  };
}
