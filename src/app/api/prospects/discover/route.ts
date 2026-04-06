import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ClearbitSuggestion {
  name: string;
  domain: string;
  logo: string;
}

interface DiscoveredContact {
  name: string;
  email: string | null;
  title: string | null;
  confidence: number;
  source: string;
}

/* ── GET: autocomplete company name → suggestions (name + domain + logo) ── */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const cbUrl = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`;
    const cbRes = await fetch(cbUrl);

    if (!cbRes.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const raw: ClearbitSuggestion[] = await cbRes.json();
    const suggestions = raw.slice(0, 6).map(({ name, domain, logo }) => ({
      name,
      domain,
      logo,
    }));

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}

/* ── POST: search contacts at a domain via Hunter.io ── */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company, domain } = body;

    if (!company || !domain) {
      return NextResponse.json(
        { error: 'company and domain are required' },
        { status: 400 },
      );
    }

    // Get user's Hunter API key or fall back to platform key
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const hunterKey = profile?.hunter_api_key || process.env.HUNTER_API_KEY;

    if (!hunterKey) {
      return NextResponse.json(
        { error: 'No Hunter.io API key configured.' },
        { status: 400 },
      );
    }

    // Domain search on Hunter.io
    const hunterUrl = new URL('https://api.hunter.io/v2/domain-search');
    hunterUrl.searchParams.set('domain', domain);
    hunterUrl.searchParams.set('api_key', hunterKey);
    hunterUrl.searchParams.set('limit', '10');

    const hunterRes = await fetch(hunterUrl.toString());
    const hunterData = await hunterRes.json();

    const contacts: DiscoveredContact[] = [];

    if (hunterRes.ok && hunterData.data?.emails) {
      for (const entry of hunterData.data.emails) {
        contacts.push({
          name: [entry.first_name, entry.last_name].filter(Boolean).join(' ') || 'Unknown',
          email: entry.value ?? null,
          title: entry.position ?? null,
          confidence: entry.confidence ?? 0,
          source: 'hunter.io',
        });
      }
    }

    // Log the discovery
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'prospect_discovery',
      detail: `${company} (${domain}) — found ${contacts.length} contacts`,
    });

    return NextResponse.json({
      company,
      domain,
      contacts,
      total: contacts.length,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
