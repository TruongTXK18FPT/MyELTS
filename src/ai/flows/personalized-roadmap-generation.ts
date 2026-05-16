'use server';

/**
 * @fileOverview Personalized Roadmap Generation flow.
 *
 * This flow generates a personalized study plan, recommending study materials and
 * daily/weekly tasks tailored to the user's target score, skill gaps, and
 * available time, including an estimated timeline.
 *
 * @exported
 * - `generatePersonalizedRoadmap`: Function to generate the personalized roadmap.
 * - `PersonalizedRoadmapInput`: Input type for the generatePersonalizedRoadmap function.
 * - `PersonalizedRoadmapOutput`: Output type for the generatePersonalizedRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedRoadmapInputSchema = z.object({
  diagnosticOverallBand: z
    .number()
    .describe('The estimated overall IELTS band score from the diagnostic placement test.'),
  diagnosticSkillBands: z.object({
    listening: z.number().describe('Estimated Listening band from the diagnostic placement test.'),
    reading: z.number().describe('Estimated Reading band from the diagnostic placement test.'),
    writing: z.number().describe('Estimated Writing band from the diagnostic placement test.'),
    speaking: z.number().describe('Estimated Speaking band from the diagnostic placement test.'),
  }),
  targetBandScore: z
    .number()
    .describe('The target overall IELTS band score of the user.'),
  availableTimePerWeek: z
    .number()
    .describe(
      'The number of hours per week the user can dedicate to studying.'
    ),
  skillGaps: z
    .string()
    .describe(
      'A description of the user skills and areas that need improvement in IELTS.'
    ),
  studyMaterialsPreference: z
    .string()
    .describe(
      'Any specific study materials or resources the user prefers (e.g., specific books, websites).'
    ),
});

export type PersonalizedRoadmapInput = z.infer<
  typeof PersonalizedRoadmapInputSchema
>;

const PersonalizedRoadmapOutputSchema = z.object({
  estimatedTimeline: z
    .string()
    .describe(
      'An estimated timeline for achieving the target band score (e.g., 3 months).'
    ),
  weeklyStudyPlan: z
    .string()
    .describe(
      'A detailed weekly study plan, including specific tasks and materials.'
    ),
  suggestedResources: z
    .string()
    .describe(
      'A list of suggested study materials and resources tailored to the user.'
    ),
});

export type PersonalizedRoadmapOutput = z.infer<
  typeof PersonalizedRoadmapOutputSchema
>;

export async function generatePersonalizedRoadmap(
  input: PersonalizedRoadmapInput
): Promise<PersonalizedRoadmapOutput> {
  return personalizedRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRoadmapPrompt',
  input: {schema: PersonalizedRoadmapInputSchema},
  output: {schema: PersonalizedRoadmapOutputSchema},
  prompt: `You are an expert IELTS tutor who specializes in creating personalized study plans.

  The learner has completed an entrance diagnostic test.
  - Estimated overall band: {{diagnosticOverallBand}}
  - Estimated skill bands:
    - Listening: {{diagnosticSkillBands.listening}}
    - Reading: {{diagnosticSkillBands.reading}}
    - Writing: {{diagnosticSkillBands.writing}}
    - Speaking: {{diagnosticSkillBands.speaking}}

  Based on this diagnostic result, target band score {{targetBandScore}}, available study time of {{availableTimePerWeek}} hours per week, identified skill gaps: {{skillGaps}}, and preferred study materials: {{studyMaterialsPreference}}, generate a personalized study plan.

  The study plan should include:
  - An estimated timeline for achieving the target band score.
  - A detailed weekly study plan with specific tasks and materials for each skill (Listening, Reading, Writing, Speaking).
  - A list of suggested study materials and resources tailored to the user.

  Ensure the study plan is realistic and achievable given the user's constraints and preferences.

  Output the plan in a structured format that is easy to follow.
  `,
});

const personalizedRoadmapFlow = ai.defineFlow(
  {
    name: 'personalizedRoadmapFlow',
    inputSchema: PersonalizedRoadmapInputSchema,
    outputSchema: PersonalizedRoadmapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
