'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { signUp, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    await signUp(email, password, fullName);
    setSubmitting(false);
  };

  const displayError = validationError || error;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold">
            Signal<span className="text-gold">IQ</span>
          </h1>
          <p className="text-ink/60 mt-2">Create your free account</p>
        </div>

        {/* Value proposition */}
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm font-medium text-gold">Free Starter Plan</p>
          <p className="text-xs text-ink/60 mt-1">
            10 AI generations/month &middot; Signal scanner &middot; Contact enrichment
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-rim/50 p-8 space-y-5">
          {displayError && (
            <div className="bg-hot/10 text-hot text-sm p-3 rounded-lg">
              {displayError}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm focus:ring-gold focus:border-gold"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm focus:ring-gold focus:border-gold"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm focus:ring-gold focus:border-gold"
            />
            <p className="text-xs text-ink/40 mt-1">Minimum 8 characters</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gold text-white py-2.5 rounded-lg font-medium hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-ink/60">
            Already have an account?{' '}
            <Link href="/login" className="text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
