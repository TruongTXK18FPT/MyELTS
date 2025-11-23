'use server';

/**
 * @fileOverview An AI agent that suggests contextually appropriate terms for improving writing in the IELTS Chat Tutor.
 *
 * - suggestContextuallyAppropriateTerms - A function that suggests contextually appropriate terms.
 * - SuggestTermsInput - The input type for the suggestContextuallyAppropriateTerms function.
 * - SuggestTermsOutput - The return type for the suggestContextuallyAppropriateTerms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTermsInputSchema = z.object({
  text: z
    .string()
    .describe('The text for which to suggest contextually appropriate terms.'),
  topic: z.string().describe('The topic of the text.'),
});
export type SuggestTermsInput = z.infer<typeof SuggestTermsInputSchema>;

const SuggestTermsOutputSchema = z.object({
  terms: z.array(z.string()).describe('An array of contextually appropriate terms.'),
});
export type SuggestTermsOutput = z.infer<typeof SuggestTermsOutputSchema>;

export async function suggestContextuallyAppropriateTerms(
  input: SuggestTermsInput
): Promise<SuggestTermsOutput> {
  return suggestTermsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTermsPrompt',
  input: {schema: SuggestTermsInputSchema},
  output: {schema: SuggestTermsOutputSchema},
  prompt: `You are an AI-powered IELTS tutor. Your goal is to suggest contextually appropriate terms to improve the user's writing.

  The user is writing about the topic: {{{topic}}}.

  Suggest a list of terms that would be appropriate in the following text:

  {{{text}}}

  Return only an array of strings.
  `,
});

const suggestTermsFlow = ai.defineFlow(
  {
    name: 'suggestTermsFlow',
    inputSchema: SuggestTermsInputSchema,
    outputSchema: SuggestTermsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
