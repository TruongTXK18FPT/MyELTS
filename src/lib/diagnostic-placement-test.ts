import { z } from 'zod';

export type PlacementSkillKey = 'listening' | 'reading' | 'writing' | 'speaking';

export const placementSkillLabels: Record<PlacementSkillKey, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

export const skillKeys = ['listening', 'reading', 'writing', 'speaking'] as const;

const bandSchema = z.coerce.number().min(0).max(9);
const targetBandSchema = z.coerce.number().min(4).max(9);

export const DiagnosticSurveySchema = z.object({
  currentOverallBand: bandSchema,
  targetOverallBand: targetBandSchema,
  targetDate: z.string().trim().max(40).optional().nullable(),
  weeklyStudyHours: z.coerce.number().int().min(1).max(60),
  skillBands: z.object({
    listening: bandSchema,
    reading: bandSchema,
    writing: bandSchema,
    speaking: bandSchema,
  }),
  targetSkillBands: z.object({
    listening: targetBandSchema,
    reading: targetBandSchema,
    writing: targetBandSchema,
    speaking: targetBandSchema,
  }),
  preferences: z.object({
    readingTopics: z.string().trim().min(2).max(300),
    writingTask1Comfort: z.string().trim().min(2).max(300),
    writingTask2Interests: z.string().trim().min(2).max(300),
    listeningAudioInterests: z.string().trim().min(2).max(300),
    speakingTopics: z.string().trim().min(2).max(300),
  }),
});

export type DiagnosticSurvey = z.infer<typeof DiagnosticSurveySchema>;

const DiagnosticQuestionTypeSchema = z.enum([
  'MCQ',
  'TRUE_FALSE_NOT_GIVEN',
  'MATCHING',
  'SUMMARY_COMPLETION',
]);

export type DiagnosticQuestionType = z.infer<typeof DiagnosticQuestionTypeSchema>;

const GeneratedReadingQuestionSchema = z.object({
  id: z.string().trim().min(1).max(30),
  type: DiagnosticQuestionTypeSchema,
  prompt: z.string().trim().min(10).max(1200),
  options: z.array(
    z.object({
      id: z.string().trim().min(1).max(10),
      text: z.string().trim().min(1).max(400),
    })
  ).min(2).max(8),
  correctOptionId: z.string().trim().min(1).max(10),
  explanation: z.string().trim().min(10).max(1000),
  skillFocus: z.string().trim().min(2).max(120).optional(),
}).superRefine((question, ctx) => {
  if (!question.options.some((option) => option.id === question.correctOptionId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['correctOptionId'],
      message: 'correctOptionId must match one of the options.',
    });
  }
});

export const GeneratedDiagnosticTestSchema = z.object({
  ieltsType: z.literal('ACADEMIC'),
  levelRationale: z.string().trim().min(20).max(1500),
  reading: z.object({
    title: z.string().trim().min(5).max(160),
    bandTarget: z.coerce.number().min(4).max(9),
    passage: z.string().trim().min(2500).max(6500),
    questions: z.array(GeneratedReadingQuestionSchema).min(10).max(14),
  }),
  writing: z.object({
    task1: z.object({
      prompt: z.string().trim().min(50).max(1800),
      visualDescription: z.string().trim().min(20).max(1200),
      rubricFocus: z.array(z.string().trim().min(2).max(120)).min(2).max(6),
    }),
    task2: z.object({
      prompt: z.string().trim().min(50).max(1200),
      questionType: z.string().trim().min(3).max(80),
      rubricFocus: z.array(z.string().trim().min(2).max(120)).min(2).max(6),
    }),
  }),
  hiddenAnswerKey: z.array(
    z.object({
      questionId: z.string().trim().min(1).max(30),
      correctOptionId: z.string().trim().min(1).max(10),
      explanation: z.string().trim().min(10).max(1000),
    })
  ).min(10).max(14),
  bandCalibrationNotes: z.array(z.string().trim().min(10).max(300)).min(2).max(8),
}).superRefine((test, ctx) => {
  const questionIds = new Set(test.reading.questions.map((question) => question.id));
  const keyIds = new Set(test.hiddenAnswerKey.map((item) => item.questionId));

  for (const question of test.reading.questions) {
    if (!keyIds.has(question.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hiddenAnswerKey'],
        message: `Missing answer key for question ${question.id}.`,
      });
    }
  }

  for (const answer of test.hiddenAnswerKey) {
    if (!questionIds.has(answer.questionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hiddenAnswerKey'],
        message: `Answer key references unknown question ${answer.questionId}.`,
      });
    }
  }

  const typeSet = new Set(test.reading.questions.map((question) => question.type));
  for (const requiredType of ['MCQ', 'TRUE_FALSE_NOT_GIVEN'] as const) {
    if (!typeSet.has(requiredType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reading', 'questions'],
        message: `Reading test must include ${requiredType} questions.`,
      });
    }
  }

  if (!typeSet.has('MATCHING') && !typeSet.has('SUMMARY_COMPLETION')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reading', 'questions'],
      message: 'Reading test must include matching or summary completion questions.',
    });
  }
});

export type GeneratedDiagnosticTest = z.infer<typeof GeneratedDiagnosticTestSchema>;

export type PublicGeneratedDiagnosticTest = Omit<GeneratedDiagnosticTest, 'hiddenAnswerKey' | 'reading'> & {
  reading: Omit<GeneratedDiagnosticTest['reading'], 'questions'> & {
    questions: Array<Omit<GeneratedDiagnosticTest['reading']['questions'][number], 'correctOptionId' | 'explanation'>>;
  };
};

export function toPublicDiagnosticTest(test: GeneratedDiagnosticTest): PublicGeneratedDiagnosticTest {
  return {
    ieltsType: test.ieltsType,
    levelRationale: test.levelRationale,
    reading: {
      title: test.reading.title,
      bandTarget: test.reading.bandTarget,
      passage: test.reading.passage,
      questions: test.reading.questions.map((question) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
        skillFocus: question.skillFocus,
      })),
    },
    writing: test.writing,
    bandCalibrationNotes: test.bandCalibrationNotes,
  };
}

export const DiagnosticSubmissionSchema = z.object({
  attemptId: z.string().trim().min(1),
  readingAnswers: z.record(z.string().trim().min(1)),
  writing: z.object({
    task1: z.string().trim().min(80).max(6000),
    task2: z.string().trim().min(120).max(8000),
  }),
});

export type DiagnosticSubmission = z.infer<typeof DiagnosticSubmissionSchema>;

export type PlacementSkillResult = {
  skill: PlacementSkillKey;
  correct: number;
  total: number;
  band: number;
};

export type DiagnosticSkillScores = {
  reading: PlacementSkillResult & {
    accuracyPercent: number;
    weakQuestionTypes: DiagnosticQuestionType[];
  };
  writing: {
    skill: 'writing';
    band: number;
    task1Band: number;
    task2Band: number;
    criteria: {
      taskAchievement: number;
      coherenceCohesion: number;
      lexicalResource: number;
      grammarRangeAccuracy: number;
    };
    weakestCriteria: string[];
  };
  listening: {
    skill: 'listening';
    band: number;
    surveyOnly: true;
  };
  speaking: {
    skill: 'speaking';
    band: number;
    surveyOnly: true;
  };
};

export type PlacementResult = {
  totalCorrect: number;
  totalQuestions: number;
  overallBand: number;
  skillResults: Record<PlacementSkillKey, { skill: PlacementSkillKey; band: number; correct?: number; total?: number }>;
  weakSkills: PlacementSkillKey[];
  strongSkills: PlacementSkillKey[];
};

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function clampBand(value: number, min = 3.5, max = 9): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return roundToHalf(Math.max(min, Math.min(max, value)));
}

export function scoreReadingBand(correct: number, total: number): number {
  if (total <= 0) {
    return 3.5;
  }

  const ratio = correct / total;
  const rawBand = 3.5 + ratio * 5.5;

  return clampBand(rawBand, 3.5, 9);
}

export function evaluateReadingAnswers(
  test: GeneratedDiagnosticTest,
  answers: Record<string, string | undefined>
) {
  const answerMap = new Map(test.hiddenAnswerKey.map((item) => [item.questionId, item.correctOptionId]));
  const questionById = new Map(test.reading.questions.map((question) => [question.id, question]));

  const details = test.reading.questions.map((question) => {
    const selectedOptionId = answers[question.id] || '';
    const correctOptionId = answerMap.get(question.id) || question.correctOptionId;
    const isCorrect = selectedOptionId === correctOptionId;

    return {
      questionId: question.id,
      type: question.type,
      prompt: question.prompt,
      selectedOptionId,
      correctOptionId,
      isCorrect,
      explanation: question.explanation,
    };
  });

  const correct = details.filter((item) => item.isCorrect).length;
  const total = test.reading.questions.length;
  const missesByType = new Map<DiagnosticQuestionType, number>();

  for (const item of details) {
    if (!item.isCorrect) {
      const question = questionById.get(item.questionId);
      if (question) {
        missesByType.set(question.type, (missesByType.get(question.type) || 0) + 1);
      }
    }
  }

  const weakQuestionTypes = [...missesByType.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => type);

  return {
    correct,
    total,
    band: scoreReadingBand(correct, total),
    accuracyPercent: total === 0 ? 0 : Math.round((correct / total) * 100),
    weakQuestionTypes,
    details,
  };
}

export function buildPlacementResultFromScores(scores: DiagnosticSkillScores): PlacementResult {
  const skillResults = {
    listening: {
      skill: 'listening' as const,
      band: scores.listening.band,
    },
    reading: {
      skill: 'reading' as const,
      correct: scores.reading.correct,
      total: scores.reading.total,
      band: scores.reading.band,
    },
    writing: {
      skill: 'writing' as const,
      band: scores.writing.band,
    },
    speaking: {
      skill: 'speaking' as const,
      band: scores.speaking.band,
    },
  };

  const overallBand = clampBand((scores.reading.band + scores.writing.band) / 2, 3.5, 9);
  const scoredSkills: PlacementSkillKey[] = ['reading', 'writing'];
  const sortedScoredSkills = [...scoredSkills].sort((a, b) => skillResults[a].band - skillResults[b].band);

  return {
    totalCorrect: scores.reading.correct,
    totalQuestions: scores.reading.total,
    overallBand,
    skillResults,
    weakSkills: sortedScoredSkills.slice(0, 2),
    strongSkills: [...sortedScoredSkills].reverse().slice(0, 2),
  };
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
