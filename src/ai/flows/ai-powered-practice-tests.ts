'use server';

/**
 * @fileOverview AI-powered IELTS practice test generation flow.
 *
 * This file defines a Genkit flow that generates IELTS practice questions
 * tailored to the user's skill level across all four sections:
 * Listening, Reading, Writing, and Speaking.
 *
 * - generatePracticeTest - A function that orchestrates the practice test generation process.
 * - GeneratePracticeTestInput - The input type for the generatePracticeTest function.
 * - GeneratePracticeTestOutput - The return type for the generatePracticeTest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PracticeSectionSchema = z.enum(['Listening', 'Reading', 'Writing', 'Speaking']);

const GeneratePracticeTestInputSchema = z.object({
  skillLevel: z
    .string()
    .describe('The user skill level (e.g., Beginner, Intermediate, Advanced).'),
  section: PracticeSectionSchema.describe('The section to generate practice questions for.'),
  topic: z.string().optional().describe('Optional topic to focus the practice questions on.'),
  numberOfQuestions: z
    .number()
    .int()
    .positive()
    .default(5)
    .describe('The number of questions to generate.'),
});
export type GeneratePracticeTestInput = z.infer<typeof GeneratePracticeTestInputSchema>;

const PracticeQuestionSchema = z.object({
  question: z.string().describe('The practice question.'),
  answer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().describe('Explanation of the answer.'),
});

const GeneratePracticeTestOutputSchema = z.object({
  questions: z.array(PracticeQuestionSchema).describe('The generated practice questions.'),
});
export type GeneratePracticeTestOutput = z.infer<typeof GeneratePracticeTestOutputSchema>;

export async function generatePracticeTest(
  input: GeneratePracticeTestInput
): Promise<GeneratePracticeTestOutput> {
  return generatePracticeTestFlow(input);
}

const practiceTestPrompt = ai.definePrompt({
  name: 'practiceTestPrompt',
  input: {schema: GeneratePracticeTestInputSchema},
  output: {schema: GeneratePracticeTestOutputSchema},
  prompt: `You are an expert IELTS exam question generator. Your task is to generate practice questions for the {{{section}}} section of the IELTS exam.

The questions should be tailored to the user's skill level: {{{skillLevel}}}.

{{#if topic}}
The questions should focus on the topic: {{{topic}}}.
{{/if}}

You should generate {{{numberOfQuestions}}} questions. Each question should have an answer and explanation. Output the result in JSON format.

Example output format:
{
  "questions": [
    {
      "question": "What is the main idea of this paragraph?",
      "answer": "The main idea is...",
      "explanation": "This answer is correct because..."
    },
    {
      "question": "Which of the following is NOT mentioned in the passage?",
      "answer": "Option C",
      "explanation": "Option C is not mentioned in the passage."
    }
  ]
}

Now generate the questions:`,
});

const generatePracticeTestFlow = ai.defineFlow(
  {
    name: 'generatePracticeTestFlow',
    inputSchema: GeneratePracticeTestInputSchema,
    outputSchema: GeneratePracticeTestOutputSchema,
  },
  async input => {
    const {output} = await practiceTestPrompt(input);
    return output!;
  }
);
