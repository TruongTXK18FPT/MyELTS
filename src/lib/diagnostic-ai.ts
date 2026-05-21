import { z } from 'zod';

import {
  DiagnosticSurvey,
  GeneratedDiagnosticTest,
  GeneratedDiagnosticTestSchema,
  clampBand,
} from '@/lib/diagnostic-placement-test';

const mistralEndpoint = 'https://api.mistral.ai/v1/chat/completions';
const DIAGNOSTIC_MODEL = process.env.MISTRAL_DIAGNOSTIC_MODEL || process.env.MISTRAL_CHAT_MODEL || 'mistral-small-latest';

type MistralChoice = {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
};

type MistralResponse = {
  choices?: MistralChoice[];
};

export const WritingDiagnosticReviewSchema = z.object({
  task1Band: z.coerce.number().min(0).max(9),
  task2Band: z.coerce.number().min(0).max(9),
  criteria: z.object({
    taskAchievement: z.coerce.number().min(0).max(9),
    coherenceCohesion: z.coerce.number().min(0).max(9),
    lexicalResource: z.coerce.number().min(0).max(9),
    grammarRangeAccuracy: z.coerce.number().min(0).max(9),
  }),
  weakestCriteria: z.array(z.string().trim().min(2).max(80)).min(1).max(4),
  summary: z.string().trim().min(20).max(1800),
  task1Feedback: z.string().trim().min(20).max(1800),
  task2Feedback: z.string().trim().min(20).max(1800),
  priorityDrills: z.array(z.string().trim().min(8).max(220)).min(2).max(6),
});

export type WritingDiagnosticReview = z.infer<typeof WritingDiagnosticReviewSchema>;

function extractMessageContent(payload: MistralResponse): string {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map((part) => (typeof part.text === 'string' ? part.text : '')).join('').trim();
  }

  return '';
}

function extractJsonText(rawContent: string): string {
  const trimmed = rawContent
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const startIndex = trimmed.indexOf('{');
  const endIndex = trimmed.lastIndexOf('}');

  if (startIndex >= 0 && endIndex > startIndex) {
    return trimmed.slice(startIndex, endIndex + 1);
  }

  return trimmed;
}

async function callMistralJson(input: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<{ value: unknown; model: string; rawContent: string }> {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error('Missing MISTRAL_API_KEY.');
  }

  const response = await fetch(mistralEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DIAGNOSTIC_MODEL,
      temperature: input.temperature ?? 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.user },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as MistralResponse | null;

  if (!response.ok || !payload) {
    throw new Error('Mistral diagnostic request failed.');
  }

  const rawContent = extractMessageContent(payload);
  const jsonText = extractJsonText(rawContent);

  if (!jsonText) {
    throw new Error('Mistral returned an empty diagnostic response.');
  }

  return {
    value: JSON.parse(jsonText) as unknown,
    model: DIAGNOSTIC_MODEL,
    rawContent,
  };
}

export async function generateDiagnosticTestWithMistral(
  survey: DiagnosticSurvey
): Promise<{ test: GeneratedDiagnosticTest; provider: 'mistral'; modelUsed: string }> {
  const system = `You are an IELTS Academic test designer and examiner.
Return strictly valid JSON only. Do not include markdown.
Create an entrance diagnostic for IELTS Academic Reading and Writing only.
The test must be original, exam-realistic, level-calibrated, and unambiguous.
Reading passage requirements:
- 550 to 750 words.
- Academic register, coherent topic development, no copyrighted source text.
- 10 to 14 questions total.
- Include MCQ, TRUE_FALSE_NOT_GIVEN, and at least one of MATCHING or SUMMARY_COMPLETION.
- Every question must have options and exactly one correctOptionId.
Writing requirements:
- Task 1 Academic visual prompt with a textual visualDescription.
- Task 2 prompt with a clear IELTS question type.
Do not reveal answers in the visible prompt text.`;

  const user = `Generate a diagnostic test using this learner survey:
${JSON.stringify(survey, null, 2)}

Return JSON with this exact top-level shape:
{
  "ieltsType": "ACADEMIC",
  "levelRationale": "...",
  "reading": {
    "title": "...",
    "bandTarget": 6.5,
    "passage": "...",
    "questions": [
      {
        "id": "R1",
        "type": "MCQ",
        "prompt": "...",
        "options": [{"id":"A","text":"..."},{"id":"B","text":"..."}],
        "correctOptionId": "B",
        "explanation": "...",
        "skillFocus": "paraphrase mapping"
      }
    ]
  },
  "writing": {
    "task1": {
      "prompt": "...",
      "visualDescription": "...",
      "rubricFocus": ["..."]
    },
    "task2": {
      "prompt": "...",
      "questionType": "Opinion",
      "rubricFocus": ["..."]
    }
  },
  "hiddenAnswerKey": [{"questionId":"R1","correctOptionId":"B","explanation":"..."}],
  "bandCalibrationNotes": ["..."]
}`;

  const result = await callMistralJson({ system, user, temperature: 0.3 });
  const test = GeneratedDiagnosticTestSchema.parse(result.value);

  return {
    test,
    provider: 'mistral',
    modelUsed: result.model,
  };
}

export async function reviewWritingDiagnosticWithMistral(input: {
  survey: DiagnosticSurvey;
  test: GeneratedDiagnosticTest;
  task1Response: string;
  task2Response: string;
}): Promise<{ review: WritingDiagnosticReview; provider: 'mistral'; modelUsed: string }> {
  const system = `You are a strict but constructive IELTS Academic Writing examiner.
Return strictly valid JSON only. Do not include markdown.
Score Task 1 and Task 2 using IELTS public band descriptors.
Use concrete evidence from the learner's writing. Do not over-credit memorized templates.
If a response is very short or off task, score it accordingly.`;

  const user = `Learner survey:
${JSON.stringify(input.survey, null, 2)}

Writing Task 1 prompt:
${input.test.writing.task1.prompt}

Task 1 visual description:
${input.test.writing.task1.visualDescription}

Learner Task 1 response:
${input.task1Response}

Writing Task 2 prompt:
${input.test.writing.task2.prompt}

Learner Task 2 response:
${input.task2Response}

Return JSON with:
{
  "task1Band": 6,
  "task2Band": 6.5,
  "criteria": {
    "taskAchievement": 6,
    "coherenceCohesion": 6,
    "lexicalResource": 6,
    "grammarRangeAccuracy": 6
  },
  "weakestCriteria": ["Task Achievement"],
  "summary": "...",
  "task1Feedback": "...",
  "task2Feedback": "...",
  "priorityDrills": ["..."]
}`;

  const result = await callMistralJson({ system, user, temperature: 0.15 });
  const parsed = WritingDiagnosticReviewSchema.parse(result.value);
  const review: WritingDiagnosticReview = {
    ...parsed,
    task1Band: clampBand(parsed.task1Band, 0, 9),
    task2Band: clampBand(parsed.task2Band, 0, 9),
    criteria: {
      taskAchievement: clampBand(parsed.criteria.taskAchievement, 0, 9),
      coherenceCohesion: clampBand(parsed.criteria.coherenceCohesion, 0, 9),
      lexicalResource: clampBand(parsed.criteria.lexicalResource, 0, 9),
      grammarRangeAccuracy: clampBand(parsed.criteria.grammarRangeAccuracy, 0, 9),
    },
  };

  return {
    review,
    provider: 'mistral',
    modelUsed: result.model,
  };
}
