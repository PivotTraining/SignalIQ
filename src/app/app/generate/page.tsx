'use client';

import { FormEvent, useState } from 'react';
import { useGenerate } from '@/hooks/useGenerate';

const STEP_LABELS: Record<string, string> = {
  idle: 'Ready',
  brief: 'Generating Intelligence Brief...',
  emails: 'Generating Email Sequence...',
  script: 'Generating Call Script...',
  done: 'Complete',
};

export default function GeneratePage() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [signalText, setSignalText] = useState('');
  const [activeTab, setActiveTab] = useState<'brief' | 'emails' | 'script'>('brief');

  const { generate, currentStep, brief, emails, script, error, loading } = useGenerate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await generate({
      name,
      company,
      title: title || undefined,
      industry: industry || undefined,
      signal_text: signalText || undefined,
    });
  };

  const hasContent = brief || emails || script;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6">Generate</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-card rounded-xl border border-rim/50 p-6 space-y-4 h-fit">
          <h2 className="font-display text-lg font-semibold">Prospect Details</h2>

          <div>
            <label className="block text-xs font-medium mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Company *</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} required className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" placeholder="Acme Corp" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" placeholder="VP of Sales" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Industry</label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" placeholder="SaaS" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Buying Signal</label>
            <textarea value={signalText} onChange={(e) => setSignalText(e.target.value)} rows={3} className="w-full rounded-lg border-rim bg-surface px-3 py-2 text-sm" placeholder="Just raised Series B, hiring 20 sales reps..." />
          </div>

          <button
            type="submit"
            disabled={loading || !name || !company}
            className="w-full bg-gold text-white py-2.5 rounded-lg font-medium hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {loading ? STEP_LABELS[currentStep] : 'Generate Package'}
          </button>

          {error && <div className="bg-hot/10 text-hot text-sm p-3 rounded-lg">{error}</div>}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-rim/30 rounded-full overflow-hidden">
                <div className={`h-full bg-gold rounded-full transition-all duration-1000 ${
                  currentStep === 'brief' ? 'w-1/3' : currentStep === 'emails' ? 'w-2/3' : 'w-full'
                } animate-stream-bar`} />
              </div>
              <span className="text-xs text-ink/40">{currentStep === 'brief' ? '1/3' : currentStep === 'emails' ? '2/3' : '3/3'}</span>
            </div>
          )}
        </form>

        {/* Output */}
        <div className="lg:col-span-3">
          {!hasContent && !loading ? (
            <div className="bg-card rounded-xl border border-rim/50 p-12 text-center text-ink/40">
              <p className="text-lg mb-2">No content generated yet</p>
              <p className="text-sm">Fill in the prospect details and click Generate Package.</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-rim/50 overflow-hidden">
              {/* Tabs */}
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

              {/* Content */}
              <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {activeTab === 'brief' && (brief || (currentStep === 'brief' && <span className="animate-cursor-blink">|</span>))}
                  {activeTab === 'emails' && (emails || (currentStep === 'emails' && <span className="animate-cursor-blink">|</span>))}
                  {activeTab === 'script' && (script || (currentStep === 'script' && <span className="animate-cursor-blink">|</span>))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
