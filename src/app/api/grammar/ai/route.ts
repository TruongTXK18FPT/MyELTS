import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';

const mistralEndpoint = 'https://api.mistral.ai/v1/chat/completions';

const grammarBriefSchema = z.object({
  id: z.string().trim().min(1).max(120),
  title: z.string().trim().min(2).max(180),
  grammarType: z.string().trim().max(120).optional().default(''),
  level: z.string().trim().max(40).optional().default(''),
  explanation: z.string().trim().max(4000).optional().default(''),
  usageGuide: z.string().trim().max(5000).optional().default(''),
  structurePattern: z.string().trim().max(1200).optional().default(''),
  exampleSentence: z.string().trim().max(1800).optional().default(''),
  storyExample: z.string().trim().max(4000).optional().default(''),
  practiceHint: z.string().trim().max(2200).optional().default(''),
});

const generateTrainingRequestSchema = z.object({
  action: z.literal('generate-training'),
  grammar: grammarBriefSchema,
});

const evaluateTrainingRequestSchema = z.object({
  action: z.literal('evaluate-training'),
  grammarTitle: z.string().trim().min(2).max(180),
  exercisePrompt: z.string().trim().min(5).max(2000),
  learnerAnswer: z.string().trim().min(1).max(2500),
});

const generateQuizRequestSchema = z.object({
  action: z.literal('generate-quiz'),
  mode: z.enum(['mcq', 'essay']),
  questionCount: z.coerce.number().int().min(1).max(30),
  grammarItems: z.array(grammarBriefSchema).min(1).max(12),
});

const evaluateEssayQuizRequestSchema = z.object({
  action: z.literal('evaluate-essay-quiz'),
  questions: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        grammarTitle: z.string().trim().min(2).max(180),
        context: z.string().trim().max(2400),
        prompt: z.string().trim().min(5).max(2200),
        sampleAnswer: z.string().trim().max(2400).optional().default(''),
      })
    )
    .min(1)
    .max(30),
  answers: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        answer: z.string().trim().max(3000).optional().default(''),
      })
    )
    .min(1)
    .max(30),
});

const requestSchema = z.discriminatedUnion('action', [
  generateTrainingRequestSchema,
  evaluateTrainingRequestSchema,
  generateQuizRequestSchema,
  evaluateEssayQuizRequestSchema,
]);

const trainingResponseSchema = z.object({
  drill: z.object({
    summary: z.string().trim().min(20).max(1600),
    contextScenario: z.string().trim().min(20).max(2200),
    exercises: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(40),
          prompt: z.string().trim().min(10).max(2000),
          focus: z.string().trim().min(2).max(200),
          sampleAnswer: z.string().trim().min(8).max(2200),
          tips: z.string().trim().min(8).max(1200),
        })
      )
      .min(3)
      .max(8),
  }),
});

const mcqQuizResponseSchema = z.object({
  quiz: z.object({
    mode: z.literal('mcq'),
    questions: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(40),
          grammarTitle: z.string().trim().min(2).max(180),
          context: z.string().trim().min(10).max(2400),
          question: z.string().trim().min(10).max(1800),
          options: z
            .array(
              z.object({
                key: z.enum(['A', 'B', 'C', 'D']),
                text: z.string().trim().min(1).max(800),
              })
            )
            .length(4),
          correctOption: z.enum(['A', 'B', 'C', 'D']),
          explanation: z.string().trim().min(10).max(1500),
        })
      )
      .min(1)
      .max(30),
  }),
});

const essayQuizResponseSchema = z.object({
  quiz: z.object({
    mode: z.literal('essay'),
    questions: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(40),
          grammarTitle: z.string().trim().min(2).max(180),
          context: z.string().trim().min(10).max(2400),
          prompt: z.string().trim().min(10).max(2200),
          sampleAnswer: z.string().trim().min(10).max(2400),
          scoringGuide: z.string().trim().min(10).max(1200),
        })
      )
      .min(1)
      .max(30),
  }),
});

const evaluateEssayResponseSchema = z.object({
  result: z.object({
    totalScore: z.number().min(0).max(300),
    maxScore: z.number().min(1).max(300),
    overallFeedback: z.string().trim().min(12).max(2200),
    items: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(80),
          score: z.number().min(0).max(10),
          maxScore: z.number().min(1).max(10),
          feedback: z.string().trim().min(10).max(1800),
          modelSuggestion: z.string().trim().min(8).max(2200),
        })
      )
      .min(1)
      .max(30),
  }),
});

type MistralChoice = {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
};

type MistralResponse = {
  choices?: MistralChoice[];
};

function extractMessageContent(payload: MistralResponse): string {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }

  return '';
}

function extractJsonText(rawContent: string): string {
  const trimmed = rawContent.trim();

  const withoutCodeFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const startIndex = withoutCodeFence.indexOf('{');
  const endIndex = withoutCodeFence.lastIndexOf('}');

  if (startIndex >= 0 && endIndex > startIndex) {
    return withoutCodeFence.slice(startIndex, endIndex + 1);
  }

  return withoutCodeFence;
}

async function callMistralForJson(userPrompt: string): Promise<unknown> {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error('Thiếu MISTRAL_API_KEY trong biến môi trường.');
  }

  const response = await fetch(mistralEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an IELTS grammar coach. Always return valid JSON only. Keep contexts practical, learner-friendly, and suitable for upper-elementary to advanced learners.',
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as MistralResponse | null;

  if (!response.ok || !payload) {
    console.error('Mistral API failed:', payload);
    throw new Error('Yêu cầu tới Mistral API thất bại.');
  }

  const rawContent = extractMessageContent(payload);
  const jsonText = extractJsonText(rawContent);

  if (!jsonText) {
    throw new Error('AI trả về dữ liệu rỗng.');
  }

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error('Không thể phân tích JSON do AI trả về.');
  }
}

function compactGrammarContext(item: z.infer<typeof grammarBriefSchema>): string {
  return [
    `Title: ${item.title}`,
    item.grammarType ? `Type: ${item.grammarType}` : '',
    item.level ? `Level: ${item.level}` : '',
    item.explanation ? `Explanation: ${item.explanation}` : '',
    item.usageGuide ? `Usage: ${item.usageGuide}` : '',
    item.structurePattern ? `Structure: ${item.structurePattern}` : '',
    item.exampleSentence ? `Example: ${item.exampleSentence}` : '',
    item.storyExample ? `Story: ${item.storyExample}` : '',
    item.practiceHint ? `Hint: ${item.practiceHint}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function clampQuestionCount(inputCount: number): number {
  return Math.max(1, Math.min(30, inputCount));
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để dùng AI training/quiz.' }, { status: 401 });
    }

    const payload = requestSchema.parse(await req.json());

    if (payload.action === 'generate-training') {
      const grammarContext = compactGrammarContext(payload.grammar);

      const aiJson = await callMistralForJson(`
Create an IELTS grammar training drill for this grammar point:
${grammarContext}

Return JSON with this exact shape:
{
  "drill": {
    "summary": "...",
    "contextScenario": "...",
    "exercises": [
      {
        "id": "ex-1",
        "prompt": "...",
        "focus": "...",
        "sampleAnswer": "...",
        "tips": "..."
      }
    ]
  }
}

Rules:
- Provide 3 to 6 exercises.
- Mix formats: sentence completion, rewrite, and short free production.
- Keep instructions clear for IELTS learners.
- sampleAnswer must be grammatically correct and concise.
- tips must point out one common mistake and one correction strategy.
- Output valid JSON only.
      `);

      const parsed = trainingResponseSchema.parse(aiJson);
      return NextResponse.json(parsed);
    }

    if (payload.action === 'evaluate-training') {
      const aiJson = await callMistralForJson(`
Evaluate a learner's answer for grammar training.

Grammar target: ${payload.grammarTitle}
Exercise prompt: ${payload.exercisePrompt}
Learner answer: ${payload.learnerAnswer}

Return JSON with this exact shape:
{
  "score": 0,
  "maxScore": 10,
  "feedback": "...",
  "improvedAnswer": "...",
  "mistakes": ["...", "..."],
  "nextStep": "..."
}

Rules:
- score is a number from 0 to 10.
- feedback must explain grammar accuracy and naturalness.
- improvedAnswer must be one corrected sentence or short paragraph.
- mistakes is a short list of specific issues.
- nextStep is one practical action.
- Output valid JSON only.
      `);

      const parsed = z
        .object({
          score: z.number().min(0).max(10),
          maxScore: z.number().min(1).max(10),
          feedback: z.string().trim().min(10).max(1800),
          improvedAnswer: z.string().trim().min(5).max(2200),
          mistakes: z.array(z.string().trim().min(3).max(400)).max(8),
          nextStep: z.string().trim().min(6).max(500),
        })
        .parse(aiJson);

      return NextResponse.json(parsed);
    }

    if (payload.action === 'generate-quiz') {
      const questionCount = clampQuestionCount(payload.questionCount);
      const grammarContext = payload.grammarItems
        .map((item, index) => `#${index + 1}\n${compactGrammarContext(item)}`)
        .join('\n\n');

      if (payload.mode === 'mcq') {
        const aiJson = await callMistralForJson(`
Create a multiple-choice grammar quiz.
Question count: ${questionCount}

Grammar pool:
${grammarContext}

Return JSON with this exact shape:
{
  "quiz": {
    "mode": "mcq",
    "questions": [
      {
        "id": "q-1",
        "grammarTitle": "...",
        "context": "...",
        "question": "...",
        "options": [
          { "key": "A", "text": "..." },
          { "key": "B", "text": "..." },
          { "key": "C", "text": "..." },
          { "key": "D", "text": "..." }
        ],
        "correctOption": "A",
        "explanation": "..."
      }
    ]
  }
}

Rules:
- Exactly ${questionCount} questions.
- Each question must include a realistic IELTS-like context.
- Only one correct option.
- Distractors must be plausible grammar mistakes.
- Output valid JSON only.
        `);

        const parsed = mcqQuizResponseSchema.parse(aiJson);

        if (parsed.quiz.questions.length > questionCount) {
          parsed.quiz.questions = parsed.quiz.questions.slice(0, questionCount);
        }

        return NextResponse.json(parsed);
      }

      const aiJson = await callMistralForJson(`
Create a short-answer grammar quiz.
Question count: ${questionCount}

Grammar pool:
${grammarContext}

Return JSON with this exact shape:
{
  "quiz": {
    "mode": "essay",
    "questions": [
      {
        "id": "q-1",
        "grammarTitle": "...",
        "context": "...",
        "prompt": "...",
        "sampleAnswer": "...",
        "scoringGuide": "..."
      }
    ]
  }
}

Rules:
- Exactly ${questionCount} questions.
- The prompt must ask the learner to write at least one sentence.
- sampleAnswer should model correct grammar naturally.
- scoringGuide should state what to check in the answer.
- Output valid JSON only.
      `);

      const parsed = essayQuizResponseSchema.parse(aiJson);

      if (parsed.quiz.questions.length > questionCount) {
        parsed.quiz.questions = parsed.quiz.questions.slice(0, questionCount);
      }

      return NextResponse.json(parsed);
    }

    const answerMap = new Map<string, string>();
    for (const entry of payload.answers) {
      answerMap.set(entry.id, entry.answer.trim());
    }

    const compactQuestions = payload.questions
      .map((question, index) => {
        const learnerAnswer = answerMap.get(question.id) || '';

        return {
          id: question.id,
          grammarTitle: question.grammarTitle,
          context: question.context,
          prompt: question.prompt,
          sampleAnswer: question.sampleAnswer,
          learnerAnswer,
          order: index + 1,
        };
      })
      .slice(0, 30);

    const aiJson = await callMistralForJson(`
Evaluate this grammar essay quiz attempt.

Questions and learner answers:
${JSON.stringify(compactQuestions, null, 2)}

Return JSON with this exact shape:
{
  "result": {
    "totalScore": 0,
    "maxScore": ${compactQuestions.length * 10},
    "overallFeedback": "...",
    "items": [
      {
        "id": "q-1",
        "score": 0,
        "maxScore": 10,
        "feedback": "...",
        "modelSuggestion": "..."
      }
    ]
  }
}

Rules:
- Give each item a score from 0 to 10.
- Focus grading on grammar accuracy, clarity, and task completion.
- overallFeedback should include 2 strengths and 2 priority improvements.
- modelSuggestion should be a corrected answer or stronger model sentence.
- Output valid JSON only.
    `);

    const parsed = evaluateEssayResponseSchema.parse(aiJson);

    if (parsed.result.items.length > compactQuestions.length) {
      parsed.result.items = parsed.result.items.slice(0, compactQuestions.length);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể xử lý yêu cầu AI cho grammar.' }, { status: 500 });
  }
}
