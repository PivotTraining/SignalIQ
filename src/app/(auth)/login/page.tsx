'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await signIn(email, password);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-rim/50 p-8 space-y-5">
      {error && (
        <div className="bg-hot/10 text-hot text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

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
          autoComplete="email"
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
          autoComplete="current-password"
          className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm focus:ring-gold focus:border-gold"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gold text-white py-2.5 rounded-lg font-medium hover:bg-gold/90 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-ink/60">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-gold hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold">
            Signal<span className="text-gold">IQ</span>
          </h1>
          <p className="text-ink/60 mt-2">Sign in to your account</p>
        </div>
        <Suspense fallback={<div className="text-center text-ink/40">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
