import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SignalIQ — AI-Powered Sales Intelligence',
  description: 'Turn buying signals into closed deals with AI-generated briefs, emails, and call scripts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
