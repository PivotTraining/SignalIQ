# SignalIQ

AI-powered sales intelligence platform that turns buying signals into closed deals.

## What It Does

- **Signal Scanner** — Detects funding rounds, leadership changes, and expansion signals via Google Custom Search
- **AI Generation** — Produces personalized intelligence briefs, 3-email sequences, and call scripts using Claude
- **Contact Enrichment** — Finds verified emails (Hunter.io) and full contact data (People Data Labs)
- **Prospect Pipeline** — Full CRUD with filtering, search, and stage tracking
- **Plan Gating** — Stripe-powered billing with per-plan monthly generation limits

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Auth:** Supabase SSR
- **Database:** Supabase PostgreSQL with Row Level Security
- **AI:** Anthropic Claude API (streaming)
- **Enrichment:** Hunter.io + People Data Labs
- **Billing:** Stripe Checkout + Webhooks
- **Styling:** TailwindCSS with custom design system

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-migration.sql` in the SQL Editor
3. Verify 6 tables appear in the Table Editor

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

At minimum, set these 4 variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Set up Stripe (billing)

1. Create Pro ($29/mo) and Agency ($79/mo) products in Stripe Dashboard
2. Copy Price IDs to `.env.local`
3. For local webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### 6. Deploy to Vercel

```bash
vercel --prod
```

Add all environment variables in Vercel Dashboard > Settings > Environment Variables.

## Architecture Decisions

- **Server-only API keys** — All external API calls route through Next.js API routes. No secrets reach the browser.
- **Defense in depth** — API routes check `user_id` even though RLS already enforces it.
- **Optimistic updates** — Hooks update local state immediately, then sync with server. Reverts on failure.
- **Streaming generation** — AI responses stream word-by-word via Server-Sent Events.
- **Upsert signals** — Signal scanner deduplicates on `source_url` to avoid duplicate entries.

## Project Structure

```
src/
├── middleware.ts               Auth protection for /app/* routes
├── types/database.ts           TypeScript types for all tables
├── lib/
│   ├── prompts.ts              AI prompt templates
│   └── supabase/
│       ├── client.ts           Browser Supabase client
│       └── server.ts           Server + admin Supabase clients
├── hooks/
│   ├── useAuth.ts              Authentication lifecycle
│   ├── useProspects.ts         Prospect CRUD + optimistic updates
│   ├── useGenerate.ts          3-step streaming AI generation
│   └── useSignals.ts           Signal feed management
└── app/
    ├── page.tsx                Landing page
    ├── (auth)/login/           Login page
    ├── (auth)/signup/          Signup page
    ├── app/dashboard/          Dashboard (authenticated)
    └── api/                    13 API routes
```
