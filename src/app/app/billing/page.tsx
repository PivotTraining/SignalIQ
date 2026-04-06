'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const PLANS = [
  {
    name: 'Starter',
    key: 'starter',
    price: 'Free',
    features: ['10 AI generations/month', 'Signal scanner', 'Basic enrichment', '1 user'],
  },
  {
    name: 'Pro',
    key: 'pro',
    price: '$29/mo',
    features: ['100 AI generations/month', 'Priority enrichment', 'Advanced signals', 'Email support'],
    popular: true,
  },
  {
    name: 'Agency',
    key: 'agency',
    price: '$79/mo',
    features: ['500 AI generations/month', 'Unlimited enrichment', 'White-label signals', 'Team seats', 'Priority support'],
  },
];

function BillingContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const currentPlan = profile?.plan ?? 'starter';

  const handleUpgrade = async (plan: string) => {
    if (plan === 'starter' || plan === currentPlan) return;
    setUpgrading(plan);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setUpgrading(null);
    }
  };

  return (
    <>
      {success && (
        <div className="bg-fresh/10 text-fresh text-sm p-4 rounded-lg mb-6">
          Subscription activated! Your plan has been upgraded.
        </div>
      )}
      {canceled && (
        <div className="bg-warm/10 text-warm text-sm p-4 rounded-lg mb-6">
          Checkout was canceled. No changes were made.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          return (
            <div
              key={plan.key}
              className={`bg-card rounded-xl border p-6 relative ${
                plan.popular ? 'border-gold shadow-gold-glow' : 'border-rim/50'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
              <p className="text-3xl font-bold mt-2 mb-4">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-ink/70 flex items-start gap-2">
                    <span className="text-fresh mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={isCurrent || upgrading !== null}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-rim/30 text-ink/50 cursor-default'
                    : plan.popular
                      ? 'bg-gold text-white hover:bg-gold/90 disabled:opacity-50'
                      : 'border border-rim text-ink hover:bg-hover disabled:opacity-50'
                }`}
              >
                {isCurrent ? 'Current Plan' : upgrading === plan.key ? 'Redirecting...' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-card rounded-xl border border-rim/50 p-6">
        <h3 className="font-display text-lg font-semibold mb-2">Usage This Month</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-rim/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all"
                style={{ width: `${Math.min(((profile?.gen_count ?? 0) / (currentPlan === 'agency' ? 500 : currentPlan === 'pro' ? 100 : 10)) * 100, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-ink/60">
            {profile?.gen_count ?? 0} / {currentPlan === 'agency' ? 500 : currentPlan === 'pro' ? 100 : 10} generations
          </span>
        </div>
      </div>
    </>
  );
}

export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6">Billing</h1>
      <Suspense fallback={<div className="text-center py-12 text-ink/40">Loading...</div>}>
        <BillingContent />
      </Suspense>
    </div>
  );
}
