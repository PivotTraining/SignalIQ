'use client';

import { useEffect, useState } from 'react';
import { useProspects } from '@/hooks/useProspects';
import type { Prospect } from '@/types/database';

export default function ScriptsPage() {
  const { prospects, refresh } = useProspects();
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [activeTab, setActiveTab] = useState<'brief' | 'emails' | 'script'>('brief');

  useEffect(() => { refresh(); }, [refresh]);

  const withContent = prospects.filter((p) => p.brief || p.emails || p.script);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Scripts &amp; Content</h1>
      <p className="text-ink/60 text-sm mb-6">View generated briefs, emails, and call scripts for your prospects.</p>

      {withContent.length === 0 ? (
        <div className="bg-card rounded-xl border border-rim/50 p-12 text-center text-ink/40">
          <p className="text-lg mb-2">No generated content yet</p>
          <p className="text-sm">Go to Generate to create briefs, emails, and scripts for your prospects.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prospect list */}
          <div className="space-y-2">
            {withContent.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelected(p); setActiveTab('brief'); }}
                className={`w-full text-left bg-card rounded-xl border p-4 transition-colors ${
                  selected?.id === p.id ? 'border-gold bg-gold/5' : 'border-rim/50 hover:border-rim'
                }`}
              >
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-ink/50">{p.company}</p>
                <div className="flex gap-1 mt-2">
                  {p.brief && <span className="text-xs bg-teal/10 text-teal px-1.5 py-0.5 rounded">Brief</span>}
                  {p.emails && <span className="text-xs bg-gold/10 text-gold px-1.5 py-0.5 rounded">Emails</span>}
                  {p.script && <span className="text-xs bg-warm/10 text-warm px-1.5 py-0.5 rounded">Script</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Content viewer */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-card rounded-xl border border-rim/50 p-12 text-center text-ink/40">
                <p className="text-sm">Select a prospect to view their generated content.</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-rim/50 overflow-hidden">
                <div className="flex border-b border-rim/30">
                  {(['brief', 'emails', 'script'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab ? 'text-gold border-b-2 border-gold bg-gold/5' : 'text-ink/50 hover:text-ink'
                      }`}
                    >
                      {tab === 'brief' ? 'Brief' : tab === 'emails' ? 'Emails' : 'Call Script'}
                    </button>
                  ))}
                </div>
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {activeTab === 'brief' && (selected.brief || <span className="text-ink/30">No brief generated</span>)}
                    {activeTab === 'emails' && (selected.emails || <span className="text-ink/30">No emails generated</span>)}
                    {activeTab === 'script' && (selected.script || <span className="text-ink/30">No script generated</span>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
