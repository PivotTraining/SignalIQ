import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DiscoveredContact {
  name: string;
  email: string | null;
  title: string | null;
  confidence: number;
  source: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company } = body;

    if (!company) {
      return NextResponse.json({ error: 'company is required' }, { status: 400 });
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
        { status: 400 }
      );
    }

    // Step 1: Domain search on Hunter.io — find all contacts at this company
    const domain = company
      .toLowerCase()
      .replace(/\s+(inc|llc|ltd|corp|co|company|group|international)\.?$/i, '')
      .trim()
      .replace(/[^a-z0-9]/g, '')
      .concat('.com');

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

    // Step 2: If Hunter found the domain but no emails, try alternate domain patterns
    if (contacts.length === 0 && hunterRes.ok) {
      // Try without stripping — e.g. "acme-corp.com"
      const altDomain = company
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .concat('.com');

      if (altDomain !== domain) {
        const altUrl = new URL('https://api.hunter.io/v2/domain-search');
        altUrl.searchParams.set('domain', altDomain);
        altUrl.searchParams.set('api_key', hunterKey);
        altUrl.searchParams.set('limit', '10');

        const altRes = await fetch(altUrl.toString());
        const altData = await altRes.json();

        if (altRes.ok && altData.data?.emails) {
          for (const entry of altData.data.emails) {
            contacts.push({
              name: [entry.first_name, entry.last_name].filter(Boolean).join(' ') || 'Unknown',
              email: entry.value ?? null,
              title: entry.position ?? null,
              confidence: entry.confidence ?? 0,
              source: 'hunter.io',
            });
          }
        }
      }
    }

    // Log the discovery
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'prospect_discovery',
      detail: `${company} — found ${contacts.length} contacts`,
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
