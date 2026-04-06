import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { buildBriefPrompt, PLAN_LIMITS } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const limit = PLAN_LIMITS[profile.plan] ?? PLAN_LIMITS.starter;
    if (profile.gen_count >= limit) {
      return new Response(
        JSON.stringify({
          error: 'Monthly generation limit reached',
          upgrade: true,
          limit,
          used: profile.gen_count,
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const prompt = buildBriefPrompt(profile, {
      name: body.name,
      company: body.company,
      title: body.title,
      industry: body.industry,
      signal_text: body.signal_text,
    });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    // Increment gen_count
    await supabase
      .from('profiles')
      .update({ gen_count: profile.gen_count + 1 })
      .eq('id', user.id);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
