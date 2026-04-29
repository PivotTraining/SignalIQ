'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Prospect, ProspectUpdate, SignalStrength, ProspectStage, ProspectPriority } from '@/types/database';

interface Filters {
  strength?: SignalStrength;
  stage?: ProspectStage;
  search?: string;
}

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Filters>({});

  const refresh = useCallback(async (filters?: Filters) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    const f = filters ?? activeFilters;
    if (f.strength) params.set('strength', f.strength);
    if (f.stage) params.set('stage', f.stage);
    if (f.search) params.set('search', f.search);

    try {
      const res = await fetch(`/api/prospects?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to fetch prospects');
        return;
      }

      setProspects(data.prospects);
    } catch {
      setError('Failed to fetch prospects');
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  const create = async (prospect: {
    name: string;
    company: string;
    title?: string;
    email?: string;
    industry?: string;
    signal_text?: string;
    signal_strength?: SignalStrength;
  }) => {
    setError(null);
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospect),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create prospect');
        return null;
      }

      setProspects((prev) => [data.prospect, ...prev]);
      return data.prospect as Prospect;
    } catch {
      setError('Failed to create prospect');
      return null;
    }
  };

  const update = async (id: string, updates: ProspectUpdate) => {
    setError(null);

    // Optimistic update
    const previous = prospects;
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } as Prospect : p))
    );

    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        // Revert on failure
        setProspects(previous);
        const data = await res.json();
        setError(data.error ?? 'Failed to update prospect');
        return false;
      }

      return true;
    } catch {
      setProspects(previous);
      setError('Failed to update prospect');
      return false;
    }
  };

  const remove = async (id: string) => {
    setError(null);

    // Optimistic removal
    const previous = prospects;
    setProspects((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/prospects/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        setProspects(previous);
        const data = await res.json();
        setError(data.error ?? 'Failed to delete prospect');
        return false;
      }

      return true;
    } catch {
      setProspects(previous);
      setError('Failed to delete prospect');
      return false;
    }
  };

  const updateStage = (id: string, stage: ProspectStage) => update(id, { stage });
  const updateNotes = (id: string, notes: string | null) => update(id, { notes });
  const updatePriority = (id: string, priority: ProspectPriority) => update(id, { priority });
  const updateLastContacted = (id: string, last_contacted: string | null) => update(id, { last_contacted });

  const filter = (filters: Filters) => {
    setActiveFilters(filters);
    refresh(filters);
  };

  const total = prospects.length;
  const hotCount = useMemo(
    () => prospects.filter((p) => p.signal_strength === 'hot').length,
    [prospects]
  );

  return {
    prospects,
    loading,
    error,
    activeFilters,
    total,
    hotCount,
    refresh,
    create,
    update,
    remove,
    updateStage,
    updateNotes,
    updatePriority,
    updateLastContacted,
    filter,
  };
}
