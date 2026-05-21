import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

import { auth } from '@/auth';
import { reviewWritingDiagnosticWithMistral, type WritingDiagnosticReview } from '@/lib/diagnostic-ai';
import {
  DiagnosticSubmissionSchema,
  DiagnosticSurveySchema,
  GeneratedDiagnosticTestSchema,
  buildPlacementResultFromScores,
  clampBand,
  evaluateReadingAnswers,
  type DiagnosticSkillScores,
} from '@/lib/diagnostic-placement-test';
import { prisma } from '@/lib/prisma';
import { placementSkillKeyToEnum } from '@/lib/roadmap';
import { getDiagnosticAttemptDelegate, getDiagnosticResultDelegate } from '@/lib/roadmap-delegate';

const DIAGNOSTIC_EXPIRY_DAYS = 30;

function asJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function buildFallbackWritingReview(writingBand: number, reason: string): WritingDiagnosticReview {
  const safeBand = clampBand(writingBand, 0, 9);

  return {
    task1Band: safeBand,
    task2Band: safeBand,
    criteria: {
      taskAchievement: safeBand,
      coherenceCohesion: safeBand,
      lexicalResource: safeBand,
      grammarRangeAccuracy: safeBand,
    },
    weakestCriteria: ['Task Response', 'Coherence and Cohesion'],
    summary: `AI writing scoring could not be completed, so the system used the learner survey band as a temporary estimate. Reason: ${reason}`,
    task1Feedback: 'Detailed Task 1 feedback is unavailable for this attempt.',
    task2Feedback: 'Detailed Task 2 feedback is unavailable for this attempt.',
    priorityDrills: [
      'Retake the diagnostic when AI writing scoring is available.',
      'Review paragraph structure and make sure each claim is supported with specific evidence.',
    ],
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để lưu kết quả diagnostic.' }, { status: 401 });
    }

    const userId = session.user.id;
    const payload = DiagnosticSubmissionSchema.parse(await req.json());
    const diagnosticAttempt = getDiagnosticAttemptDelegate();
    const diagnosticResult = getDiagnosticResultDelegate();

    if (!diagnosticAttempt || !diagnosticResult) {
      return NextResponse.json(
        { error: 'Hệ thống diagnostic chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const attempt = await diagnosticAttempt.findUnique({
      where: { id: payload.attemptId },
      select: {
        id: true,
        userId: true,
        status: true,
        survey: true,
        generatedTest: true,
        provider: true,
        modelUsed: true,
      },
    });

    if (!attempt || attempt.userId !== userId) {
      return NextResponse.json({ error: 'Không tìm thấy diagnostic attempt.' }, { status: 404 });
    }

    if (attempt.status !== 'GENERATED') {
      return NextResponse.json({ error: 'Diagnostic attempt này đã được nộp trước đó.' }, { status: 409 });
    }

    const survey = DiagnosticSurveySchema.parse(attempt.survey);
    const generatedTest = GeneratedDiagnosticTestSchema.parse(attempt.generatedTest);
    const missingAnswers = generatedTest.reading.questions.filter((question) => !payload.readingAnswers[question.id]);

    if (missingAnswers.length > 0) {
      return NextResponse.json(
        { error: 'Bạn cần hoàn thành tất cả câu hỏi Reading trước khi nộp bài.' },
        { status: 400 }
      );
    }

    const readingEvaluation = evaluateReadingAnswers(generatedTest, payload.readingAnswers);
    let writingReview: WritingDiagnosticReview;
    let writingProvider = 'fallback';
    let writingModelUsed = attempt.modelUsed || null;

    try {
      const aiReview = await reviewWritingDiagnosticWithMistral({
        survey,
        test: generatedTest,
        task1Response: payload.writing.task1,
        task2Response: payload.writing.task2,
      });
      writingReview = aiReview.review;
      writingProvider = aiReview.provider;
      writingModelUsed = aiReview.modelUsed;
    } catch (error) {
      console.error('Writing diagnostic review fallback:', error);
      writingReview = buildFallbackWritingReview(
        survey.skillBands.writing,
        error instanceof Error ? error.message : 'unknown error'
      );
    }

    const writingBand = clampBand((writingReview.task1Band + writingReview.task2Band) / 2, 0, 9);
    const skillScores: DiagnosticSkillScores = {
      reading: {
        skill: 'reading',
        correct: readingEvaluation.correct,
        total: readingEvaluation.total,
        band: readingEvaluation.band,
        accuracyPercent: readingEvaluation.accuracyPercent,
        weakQuestionTypes: readingEvaluation.weakQuestionTypes,
      },
      writing: {
        skill: 'writing',
        band: writingBand,
        task1Band: writingReview.task1Band,
        task2Band: writingReview.task2Band,
        criteria: writingReview.criteria,
        weakestCriteria: writingReview.weakestCriteria,
      },
      listening: {
        skill: 'listening',
        band: clampBand(survey.skillBands.listening, 0, 9),
        surveyOnly: true,
      },
      speaking: {
        skill: 'speaking',
        band: clampBand(survey.skillBands.speaking, 0, 9),
        surveyOnly: true,
      },
    };

    const result = buildPlacementResultFromScores(skillScores);
    const takenAt = new Date();
    const expiresAt = new Date(takenAt.getTime() + DIAGNOSTIC_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const aiReviewPayload = {
      provider: writingProvider,
      modelUsed: writingModelUsed,
      writing: writingReview,
      reading: {
        details: readingEvaluation.details,
        weakQuestionTypes: readingEvaluation.weakQuestionTypes,
      },
      surveyOnlySkills: ['listening', 'speaking'],
    };

    const submittedAnswers = {
      readingAnswers: payload.readingAnswers,
      writing: payload.writing,
    };

    const created = await prisma.$transaction(async (tx) => {
      const txDiagnosticResult = getDiagnosticResultDelegate(tx);
      const txDiagnosticAttempt = getDiagnosticAttemptDelegate(tx);

      if (!txDiagnosticResult || !txDiagnosticAttempt) {
        throw new Error('Diagnostic delegates are unavailable in transaction context.');
      }

      const createdDiagnostic = await txDiagnosticResult.create({
        data: {
          userId,
          takenAt,
          expiresAt,
          overallBand: result.overallBand,
          listeningBand: skillScores.listening.band,
          readingBand: skillScores.reading.band,
          writingBand: skillScores.writing.band,
          speakingBand: skillScores.speaking.band,
          weakSkills: result.weakSkills.map((skill) => placementSkillKeyToEnum[skill]),
          strongSkills: result.strongSkills.map((skill) => placementSkillKeyToEnum[skill]),
          rawAnswers: asJsonValue({
            attemptId: attempt.id,
            ieltsType: 'ACADEMIC',
            survey,
            submittedAnswers,
            skillScores,
            aiReview: aiReviewPayload,
          }),
        },
        select: {
          id: true,
          takenAt: true,
          expiresAt: true,
        },
      });

      await txDiagnosticAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: takenAt,
          submittedAnswers: asJsonValue(submittedAnswers),
          skillScores: asJsonValue(skillScores),
          aiReview: asJsonValue(aiReviewPayload),
          diagnosticResultId: createdDiagnostic.id,
          provider: writingProvider,
          modelUsed: writingModelUsed,
        },
      });

      return createdDiagnostic;
    });

    return NextResponse.json({
      diagnostic: {
        id: created.id,
        takenAt: created.takenAt.toISOString(),
        expiresAt: created.expiresAt.toISOString(),
      },
      result,
      review: aiReviewPayload,
      skillScores,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Dữ liệu diagnostic không hợp lệ.' },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể lưu kết quả diagnostic.' }, { status: 500 });
  }
}
