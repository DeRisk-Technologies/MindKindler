// src/ai/utils/composeConsultationPrompt.ts

import { buildSystemPrompt, AIContext } from './prompt-builder';

export interface EvidenceItem {
  sourceId: string;
  type: string;
  snippet: string;
  trust: number;
}

export interface ConsultationPromptInput extends AIContext {
  baseInstruction: string;
  transcript?: string;
  notes?: string;
  studentHistory?: string;
  evidence?: EvidenceItem[];
}

export function composeConsultationPrompt(input: ConsultationPromptInput): string {
  // 1. Build Base System Prompt with Locale/Glossary Injection
  const systemContext = buildSystemPrompt(input.baseInstruction, {
    locale: input.locale,
    languageLabel: input.languageLabel,
    glossary: input.glossary,
  });

  let prompt = `${systemContext}\n\n`;

  // 2. Evidence Block (RAG)
  if (input.evidence && input.evidence.length > 0) {
    prompt += `### Evidence & Knowledge Base:\n`;
    prompt += `Use the following context to inform your response if relevant. Do not hallucinate trust scores.\n\n`;
    input.evidence.slice(0, 5).forEach((item, idx) => {
      prompt += `[Evidence ${idx + 1}] (Source: ${item.type}, Trust: ${item.trust})\n`;
      prompt += `"${item.snippet}"\n\n`;
    });
  }

  // 3. Clinical Data Context
  if (input.studentHistory) {
    prompt += `### Student History:\n${input.studentHistory}\n\n`;
  }

  if (input.transcript) {
    prompt += `### Session Transcript (Raw):\n${input.transcript}\n\n`;
  }

  if (input.notes) {
    prompt += `### Clinician Notes:\n${input.notes}\n\n`;
  }

  // 4. Final Instruction Trigger
  prompt += `### Task:\n`;
  prompt += `Based on the above context, execute the requested analysis or report generation strictly adhering to the output schema.`;

  return prompt;
}
