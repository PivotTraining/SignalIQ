import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { first_name, last_name, company } = body;

    if (!first_name || !last_name || !company) {
      return NextResponse.json(
        { error: 'first_name, last_name, and company are required' },
        { status: 400 }
      );
    }

    // Get user's Hunter API key or fall back to platform key
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const apiKey = profile?.hunter_api_key || process.env.HUNTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Hunter.io API key configured. Add one in your profile settings.' },
        { status: 400 }
      );
    }

    // Derive domain from company name
    const domain = company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .concat('.com');

    const hunterUrl = new URL('https://api.hunter.io/v2/email-finder');
    hunterUrl.searchParams.set('domain', domain);
    hunterUrl.searchParams.set('first_name', first_name);
    hunterUrl.searchParams.set('last_name', last_name);
    hunterUrl.searchParams.set('api_key', apiKey);

    const response = await fetch(hunterUrl.toString());
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.errors?.[0]?.details ?? 'Hunter.io API error' },
        { status: response.status }
      );
    }

    const data = result.data;

    // Log the lookup
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'email_lookup',
      detail: `${first_name} ${last_name} at ${company}`,
    });

    if (!data?.email) {
      return NextResponse.json({
        found: false,
        domain,
        message: 'No email found for this contact',
      });
    }

    return NextResponse.json({
      found: true,
      email: data.email,
      confidence: data.confidence,
      sources: data.sources?.length ?? 0,
      domain,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
