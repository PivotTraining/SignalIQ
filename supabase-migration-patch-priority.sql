-- =============================================================================
-- SignalIQ Patch Migration: Add priority column to prospects
-- Run this in the Supabase SQL Editor if your database already exists
-- =============================================================================

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS priority text
  CHECK (priority IN ('high', 'medium', 'low'));

-- priority defaults to NULL (blank) — manually assigned per prospect
