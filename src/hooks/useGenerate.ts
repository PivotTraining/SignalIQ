'use client';

import { useState } from 'react';
import type { ProspectContext } from '@/types/database';

export interface GeneratedPackage {
  brief: string;
  emails: string;
  script: string;
}

type GenerationStep = 'idle' | 'brief' | 'emails' | 'script' | 'done';

async function streamFromRoute(
  url: string,
  prospect: ProspectContext,
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prospect),
  });

  if (!res.ok) {
    const data = await res.json();
    if (res.status === 402 && data.upgrade) {
      throw new Error('PLAN_LIMIT_REACHED');
    }
    throw new Error(data.error ?? 'Generation failed');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.text) {
            full += parsed.text;
            onChunk(parsed.text);
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }

  return full;
}

export function useGenerate() {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('idle');
  const [brief, setBrief] = useState('');
  const [emails, setEmails] = useState('');
  const [script, setScript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async (prospect: ProspectContext): Promise<GeneratedPackage | null> => {
    setLoading(true);
    setError(null);
    setBrief('');
    setEmails('');
    setScript('');

    try {
      // Step 1: Brief
      setCurrentStep('brief');
      const briefResult = await streamFromRoute(
        '/api/generate/brief',
        prospect,
        (text) => setBrief((prev) => prev + text)
      );

      // Step 2: Emails
      setCurrentStep('emails');
      const emailsResult = await streamFromRoute(
        '/api/generate/emails',
        prospect,
        (text) => setEmails((prev) => prev + text)
      );

      // Step 3: Script
      setCurrentStep('script');
      const scriptResult = await streamFromRoute(
        '/api/generate/script',
        prospect,
        (text) => setScript((prev) => prev + text)
      );

      setCurrentStep('done');
      return { brief: briefResult, emails: emailsResult, script: scriptResult };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      if (message === 'PLAN_LIMIT_REACHED') {
        setError('You\'ve reached your monthly generation limit. Upgrade your plan to continue.');
      } else {
        setError(message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generate,
    currentStep,
    brief,
    emails,
    script,
    error,
    loading,
  };
}
