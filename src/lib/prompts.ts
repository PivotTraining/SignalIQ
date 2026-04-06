import type { Profile, ProspectContext } from '@/types/database';

export const PLAN_LIMITS: Record<string, number> = {
  starter: 10,
  pro: 100,
  agency: 500,
};

export function buildBriefPrompt(profile: Profile, prospect: ProspectContext): string {
  return `You are a senior sales strategist at a boutique consulting firm. Write a concise intelligence brief for an upcoming outreach to a prospect.

SELLER CONTEXT:
- Business: ${profile.business_name}
- Offer: ${profile.offer_text}

PROSPECT:
- Name: ${prospect.name}
- Company: ${prospect.company}
${prospect.title ? `- Title: ${prospect.title}` : ''}
${prospect.industry ? `- Industry: ${prospect.industry}` : ''}
${prospect.signal_text ? `- Buying Signal: ${prospect.signal_text}` : ''}

Write a 2-3 paragraph intelligence brief that:
1. Analyzes why this prospect is a strong fit right now
2. Identifies the likely pain point based on their role and the buying signal
3. Recommends a specific angle of approach that connects the seller's offer to the prospect's situation

Be specific, strategic, and actionable. No generic advice.`;
}

export function buildEmailsPrompt(profile: Profile, prospect: ProspectContext): string {
  return `You are an expert B2B email copywriter specializing in warm outreach. Write a 3-email sequence for reaching out to a prospect.

SELLER CONTEXT:
- Business: ${profile.business_name}
- Offer: ${profile.offer_text}

PROSPECT:
- Name: ${prospect.name}
- Company: ${prospect.company}
${prospect.title ? `- Title: ${prospect.title}` : ''}
${prospect.industry ? `- Industry: ${prospect.industry}` : ''}
${prospect.signal_text ? `- Buying Signal: ${prospect.signal_text}` : ''}

Write exactly 3 emails:

EMAIL 1 — Initial Outreach
- Subject line that references their specific situation
- Opens with the buying signal or a relevant observation about their company
- Connects to the seller's offer naturally
- Ends with a soft CTA (question, not a meeting request)

EMAIL 2 — Follow-Up (3 days later)
- New angle — do not repeat Email 1
- Adds value (insight, stat, or relevant case study reference)
- Slightly stronger CTA

EMAIL 3 — Break-Up (5 days later)
- Brief and direct
- Acknowledges they're busy
- Final value statement
- Clear close

Format each email with SUBJECT:, BODY:, and SEND TIMING: headers.`;
}

export function buildScriptPrompt(profile: Profile, prospect: ProspectContext): string {
  return `You are a sales call coach who specializes in consultative selling. Create a call framework for an initial conversation with a prospect.

SELLER CONTEXT:
- Business: ${profile.business_name}
- Offer: ${profile.offer_text}

PROSPECT:
- Name: ${prospect.name}
- Company: ${prospect.company}
${prospect.title ? `- Title: ${prospect.title}` : ''}
${prospect.industry ? `- Industry: ${prospect.industry}` : ''}
${prospect.signal_text ? `- Buying Signal: ${prospect.signal_text}` : ''}

Create a structured call framework with these sections:

OPENING (30 seconds)
- A natural, non-salesy opening line
- Reference to how you found them or why you're reaching out

DISCOVERY QUESTIONS (3-5 questions)
- Questions that uncover their current situation and pain
- Each question should build on the previous one
- Include follow-up prompts for likely responses

VALUE BRIDGE (60 seconds)
- How to transition from their pain to your solution
- Specific talking points connecting their situation to your offer

OBJECTION HANDLING
- 3 likely objections based on their role and industry
- A concise response framework for each

CLOSE
- A specific, low-commitment next step to propose
- Alternative close if they hesitate

Keep the tone consultative, not pushy. This is a framework, not a script — the seller should sound natural.`;
}
