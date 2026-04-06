import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SignalStrength } from '@/types/database';

const SIGNAL_KEYWORDS: Record<string, { type: SignalStrength; score: number }> = {
  'hiring': { type: 'warm', score: 40 },
  'expansion': { type: 'hot', score: 80 },
  'funding': { type: 'hot', score: 90 },
  'raised': { type: 'hot', score: 85 },
  'series': { type: 'hot', score: 85 },
  'acquisition': { type: 'hot', score: 75 },
  'merger': { type: 'hot', score: 70 },
  'launch': { type: 'warm', score: 50 },
  'partnership': { type: 'warm', score: 45 },
  'restructuring': { type: 'trigger', score: 65 },
  'layoff': { type: 'trigger', score: 70 },
  'new ceo': { type: 'trigger', score: 80 },
  'new cto': { type: 'trigger', score: 75 },
  'ipo': { type: 'hot', score: 95 },
  'revenue': { type: 'warm', score: 55 },
  'growth': { type: 'warm', score: 50 },
  'contract': { type: 'warm', score: 45 },
  'digital transformation': { type: 'hot', score: 70 },
  'ai adoption': { type: 'hot', score: 75 },
};

function scoreSignal(title: string, snippet: string): { type: SignalStrength; score: number } {
  const text = `${title} ${snippet}`.toLowerCase();
  let bestScore = 0;
  let bestType: SignalStrength = 'warm';

  for (const [keyword, config] of Object.entries(SIGNAL_KEYWORDS)) {
    if (text.includes(keyword) && config.score > bestScore) {
      bestScore = config.score;
      bestType = config.type;
    }
  }

  return { type: bestType, score: bestScore || 30 };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const googleApiKey = process.env.GOOGLE_NEWS_API_KEY;
    const searchEngineId = process.env.GOOGLE_NEWS_SEARCH_ENGINE_ID;

    // If no Google API key, return cached signals
    if (!googleApiKey || !searchEngineId) {
      const { data: cached } = await supabase
        .from('signals')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('score', { ascending: false })
        .limit(20);

      return NextResponse.json({
        signals: cached ?? [],
        source: 'cache',
      });
    }

    // Get user's target industries for search queries
    const { data: industries } = await supabase
      .from('target_industries')
      .select('name')
      .eq('user_id', user.id);

    const queries = industries?.length
      ? industries.map((i) => `${i.name} business news`)
      : ['B2B sales opportunities', 'company funding news', 'business expansion news'];

    // Run parallel searches
    const searchPromises = queries.slice(0, 3).map(async (query) => {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', googleApiKey);
      url.searchParams.set('cx', searchEngineId);
      url.searchParams.set('q', query);
      url.searchParams.set('num', '5');
      url.searchParams.set('sort', 'date');

      const res = await fetch(url.toString());
      if (!res.ok) return [];
      const data = await res.json();
      return data.items ?? [];
    });

    const results = (await Promise.all(searchPromises)).flat();

    // Score and deduplicate
    const scored = results.map((item: { title: string; snippet: string; link: string }) => {
      const { type, score } = scoreSignal(item.title, item.snippet ?? '');
      return {
        user_id: user.id,
        title: item.title,
        snippet: item.snippet ?? null,
        source_url: item.link,
        signal_type: type,
        score,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Upsert to avoid duplicates
    if (scored.length > 0) {
      await supabase
        .from('signals')
        .upsert(scored, { onConflict: 'user_id,source_url' });
    }

    return NextResponse.json({
      signals: scored,
      source: 'live',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    }

    const update = action === 'dismiss'
      ? { dismissed: true }
      : action === 'convert'
        ? { converted: true }
        : null;

    if (!update) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await supabase
      .from('signals')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
