import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <h1 className="font-display text-2xl font-bold text-ink">
          Signal<span className="text-gold">IQ</span>
        </h1>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-ink/70 hover:text-ink transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors"
          >
            Start Free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto">
        <div className="animate-fade-up">
          <p className="text-sm font-medium text-gold uppercase tracking-widest mb-4">
            AI-Powered Sales Intelligence
          </p>
          <h2 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6">
            Turn buying signals into{' '}
            <span className="text-gold">closed deals</span>
          </h2>
          <p className="text-lg text-ink/60 max-w-2xl mx-auto mb-10">
            SignalIQ scans for real-time buying signals, enriches contact data, and generates
            personalized briefs, email sequences, and call scripts — all powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-gold text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gold/90 shadow-gold-glow transition-all"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="border border-rim text-ink px-8 py-3 rounded-lg text-lg font-medium hover:bg-hover transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full">
          {[
            {
              title: 'Signal Scanner',
              description: 'Detect funding rounds, leadership changes, and expansion signals in real time.',
              icon: '📡',
            },
            {
              title: 'AI Generation',
              description: 'Get personalized briefs, 3-email sequences, and call scripts in seconds.',
              icon: '⚡',
            },
            {
              title: 'Contact Enrichment',
              description: 'Find verified emails and phone numbers with Hunter.io and People Data Labs.',
              icon: '🔍',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-6 border border-rim/50 text-left"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-ink/60 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-ink/40 py-8 border-t border-rim/30">
        &copy; {new Date().getFullYear()} Pivot Training &amp; Development. All rights reserved.
      </footer>
    </main>
  );
}
