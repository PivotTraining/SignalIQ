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
    const { name, company, email } = body;

    if (!name && !email) {
      return NextResponse.json(
        { error: 'Either name+company or email is required' },
        { status: 400 }
      );
    }

    // Get user's PDL API key or fall back to platform key
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const apiKey = profile?.pdl_api_key || process.env.PDL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No People Data Labs API key configured.' },
        { status: 400 }
      );
    }

    // Build PDL person enrichment request
    const params: Record<string, string> = {};
    if (email) {
      params.email = email;
    } else {
      params.name = name;
      if (company) params.company = company;
    }

    const pdlUrl = new URL('https://api.peopledatalabs.com/v5/person/enrich');
    for (const [key, value] of Object.entries(params)) {
      pdlUrl.searchParams.set(key, value);
    }

    const pdlResponse = await fetch(pdlUrl.toString(), {
      headers: { 'X-Api-Key': apiKey },
    });

    const result = await pdlResponse.json();

    // Log the enrichment
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'contact_enrichment',
      detail: email ?? `${name} at ${company}`,
    });

    if (!pdlResponse.ok || !result.data) {
      return NextResponse.json({
        found: false,
        message: 'Contact not found in People Data Labs',
      });
    }

    // Extract only the fields SignalIQ needs
    const person = result.data;
    return NextResponse.json({
      found: true,
      full_name: person.full_name ?? name,
      work_email: person.work_email ?? email ?? null,
      mobile_phone: person.mobile_phone ?? null,
      linkedin_url: person.linkedin_url ?? null,
      title: person.job_title ?? null,
      company: person.job_company_name ?? company ?? null,
      industry: person.industry ?? null,
      location: person.location_name ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
