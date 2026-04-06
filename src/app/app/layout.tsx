export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-white p-6 hidden md:flex flex-col">
        <h1 className="font-display text-xl font-bold mb-8">
          Signal<span className="text-gold">IQ</span>
        </h1>
        <nav className="flex flex-col gap-1 flex-1">
          {[
            { href: '/app/dashboard', label: 'Dashboard' },
            { href: '/app/leads', label: 'Leads' },
            { href: '/app/signals', label: 'Signals' },
            { href: '/app/generate', label: 'Generate' },
            { href: '/app/scripts', label: 'Scripts' },
            { href: '/app/integrations', label: 'Integrations' },
            { href: '/app/billing', label: 'Billing' },
            { href: '/app/profile', label: 'Profile' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="text-xs text-white/30 mt-4">
          &copy; {new Date().getFullYear()} Pivot Training
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
