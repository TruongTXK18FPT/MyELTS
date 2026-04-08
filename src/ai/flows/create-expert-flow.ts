import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(8000),
});

const ExpertPromptInputSchema = z.object({
  message: z.string().min(1).max(8000),
  historyText: z.string().max(24000).optional().default(''),
});

export const TutorExpertInputSchema = z.object({
  message: z.string().min(1).max(8000),
  history: z.array(HistoryItemSchema).max(20).optional().default([]),
});

export const TutorExpertOutputSchema = z.object({
  response: z.string().min(1),
  contentType: z
    .enum(['TEXT', 'ESSAY_EVALUATION', 'LISTENING_EXERCISE', 'READING_PASSAGE', 'SPEAKING_FEEDBACK'])
    .default('TEXT'),
  metadata: z.record(z.unknown()).optional(),
  youtubeLinks: z.array(z.string()).optional().default([]),
});

export type TutorExpertInput = z.infer<typeof TutorExpertInputSchema>;
export type TutorExpertOutput = z.infer<typeof TutorExpertOutputSchema>;

function stringifyHistory(history: TutorExpertInput['history']): string {
  if (!history || history.length === 0) {
    return 'No history yet.';
  }

  return history
    .map((item, index) => `${index + 1}. [${item.role.toUpperCase()}] ${item.content}`)
    .join('\n');
}

export function createExpertFlow(flowName: string, systemPrompt: string) {
  const prompt = ai.definePrompt({
    name: `${flowName}Prompt`,
    input: { schema: ExpertPromptInputSchema },
    output: { schema: TutorExpertOutputSchema },
    prompt: `${systemPrompt}

  Global style policy:
  - Keep responses academically accurate for IELTS.
  - Keep tone warm, sweet, and encouraging.
  - Be concise, actionable, and kind.
  - You can follow learner language for explanations, but generated IELTS prompts/questions/tests must default to English unless the learner explicitly requests Vietnamese.
  - Use at most 1-2 cute emoji when it improves warmth, never spam.
  - For structured outputs, prefer short markdown sections and practical next steps.

Conversation history:
{{{historyText}}}

Latest learner message:
{{{message}}}

Return a JSON object with:
- response: markdown response for learner
- contentType: one of TEXT, ESSAY_EVALUATION, LISTENING_EXERCISE, READING_PASSAGE, SPEAKING_FEEDBACK
- metadata: optional object for scoring and structured hints
- youtubeLinks: optional list of useful links
`,
  });

  const flow = ai.defineFlow(
    {
      name: flowName,
      inputSchema: TutorExpertInputSchema,
      outputSchema: TutorExpertOutputSchema,
    },
    async (input) => {
      const { output } = await prompt({
        message: input.message,
        historyText: stringifyHistory(input.history),
      });

      return output!;
    }
  );

  return flow;
}
