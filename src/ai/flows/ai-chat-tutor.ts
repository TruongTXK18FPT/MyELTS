'use server';

/**
 * @fileOverview An AI Chat Tutor flow that provides instant feedback on grammar, vocabulary, and style.
 *
 * - aiChatTutor - A function that handles the AI chat tutoring process.
 * - AIChatTutorInput - The input type for the aiChatTutor function.
 * - AIChatTutorOutput - The return type for the aiChatTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatTutorInputSchema = z.object({
  message: z.string().describe('The user message to be evaluated.'),
  language: z.enum(['en', 'vi']).describe('The language of the message (en: English, vi: Vietnamese).'),
});
export type AIChatTutorInput = z.infer<typeof AIChatTutorInputSchema>;

const AIChatTutorOutputSchema = z.object({
  feedback: z.string().describe('The AI tutor feedback on the user message.'),
});
export type AIChatTutorOutput = z.infer<typeof AIChatTutorOutputSchema>;

export async function aiChatTutor(input: AIChatTutorInput): Promise<AIChatTutorOutput> {
  return aiChatTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatTutorPrompt',
  input: {schema: AIChatTutorInputSchema},
  output: {schema: AIChatTutorOutputSchema},
  prompt: `You are an AI tutor specializing in providing feedback on English and Vietnamese language skills.

  A user will provide a message in either English or Vietnamese, and you will provide feedback on their grammar, vocabulary, and style.

  Message ({{{language}}}): {{{message}}}

  Feedback:
  `,
});

const aiChatTutorFlow = ai.defineFlow(
  {
    name: 'aiChatTutorFlow',
    inputSchema: AIChatTutorInputSchema,
    outputSchema: AIChatTutorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
