import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const strength = searchParams.get('strength');
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');

    let query = supabase
      .from('prospects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (strength) {
      query = query.eq('signal_strength', strength);
    }
    if (stage) {
      query = query.eq('stage', stage);
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,company.ilike.%${search}%,signal_text.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prospects: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name || !body.company) {
      return NextResponse.json(
        { error: 'name and company are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('prospects')
      .insert({
        user_id: user.id,
        name: body.name,
        company: body.company,
        title: body.title ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        linkedin_url: body.linkedin_url ?? null,
        industry: body.industry ?? null,
        location: body.location ?? null,
        signal_text: body.signal_text ?? null,
        signal_strength: body.signal_strength ?? 'warm',
        stage: body.stage ?? 'new',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the creation
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'prospect_created',
      detail: `${body.name} at ${body.company}`,
    });

    return NextResponse.json({ prospect: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
