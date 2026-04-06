import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const stripe = getStripe();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        // Determine plan from price
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;

        const plan = priceId === process.env.STRIPE_AGENCY_PRICE_ID
          ? 'agency'
          : 'pro';

        await adminClient
          .from('profiles')
          .update({ plan, updated_at: new Date().toISOString() })
          .eq('id', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(
          subscription.customer as string
        ) as Stripe.Customer;
        const userId = customer.metadata?.supabase_user_id;
        if (!userId) break;

        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId === process.env.STRIPE_AGENCY_PRICE_ID
          ? 'agency'
          : 'pro';

        await adminClient
          .from('profiles')
          .update({ plan, updated_at: new Date().toISOString() })
          .eq('id', userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(
          subscription.customer as string
        ) as Stripe.Customer;
        const userId = customer.metadata?.supabase_user_id;
        if (!userId) break;

        await adminClient
          .from('profiles')
          .update({ plan: 'starter', updated_at: new Date().toISOString() })
          .eq('id', userId);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
