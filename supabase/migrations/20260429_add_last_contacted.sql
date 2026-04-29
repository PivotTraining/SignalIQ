-- Add last_contacted column to prospects table
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS last_contacted DATE;
