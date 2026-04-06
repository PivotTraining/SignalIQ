'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { profile, user, loading, error, updateProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [offerText, setOfferText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setBusinessName(profile.business_name);
      setOfferText(profile.offer_text);
    }
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateProfile({
      full_name: fullName,
      business_name: businessName,
      offer_text: offerText,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-ink/40">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6">Profile</h1>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-rim/50 p-6 space-y-5">
        {error && <div className="bg-hot/10 text-hot text-sm p-3 rounded-lg">{error}</div>}
        {saved && <div className="bg-fresh/10 text-fresh text-sm p-3 rounded-lg">Profile saved!</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input value={user?.email ?? ''} disabled className="w-full rounded-lg border-rim bg-lift px-3 py-2 text-sm text-ink/50" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" placeholder="Your company name" />
          <p className="text-xs text-ink/40 mt-1">Used in AI-generated content to personalize your outreach.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Your Offer</label>
          <textarea value={offerText} onChange={(e) => setOfferText(e.target.value)} rows={4} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" placeholder="Describe what you sell and who you help..." />
          <p className="text-xs text-ink/40 mt-1">The AI uses this to tailor briefs, emails, and scripts to your specific offer.</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-gold text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          <button
            type="button"
            onClick={signOut}
            className="text-sm text-hot/60 hover:text-hot"
          >
            Sign Out
          </button>
        </div>
      </form>

      <div className="mt-6 bg-card rounded-xl border border-rim/50 p-6">
        <h3 className="font-display text-lg font-semibold mb-3">Plan</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium capitalize">{profile?.plan ?? 'starter'}</p>
            <p className="text-xs text-ink/50">{profile?.gen_count ?? 0} generations used this month</p>
          </div>
          <a href="/app/billing" className="text-sm text-gold hover:underline">Manage billing &rarr;</a>
        </div>
      </div>
    </div>
  );
}
