import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { generatePersonalizedRoadmap } from '@/ai/flows/personalized-roadmap-generation';
import { prisma } from '@/lib/prisma';
import { getDiagnosticResultDelegate, getRoadmapPlanDelegate } from '@/lib/roadmap-delegate';
import {
  buildRoadmapBlueprint,
  isDiagnosticExpired,
  placementSkillKeyToEnum,
  toPlacementSkillKeys,
} from '@/lib/roadmap';
import { serializeRoadmapPlan } from '@/lib/roadmap-serialization';

const generateRoadmapSchema = z.object({
  targetBandScore: z.coerce.number().min(4.0).max(9.0),
  availableTimePerWeek: z.coerce.number().int().min(3).max(40),
  studyMaterialsPreference: z.string().trim().max(500).optional().nullable(),
});

function deriveWeakSkillsFromBands(skillBands: {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}) {
  const ordered = (Object.entries(skillBands) as Array<[keyof typeof skillBands, number]>).sort(
    (a, b) => a[1] - b[1]
  );

  return ordered.slice(0, 2).map(([skill]) => skill);
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để tạo roadmap.' }, { status: 401 });
    }

    const userId = session.user.id;

    const payload = generateRoadmapSchema.parse(await req.json());

    const diagnosticResult = getDiagnosticResultDelegate();
    const roadmapPlan = getRoadmapPlanDelegate();

    if (!diagnosticResult || !roadmapPlan) {
      return NextResponse.json(
        { error: 'Hệ thống roadmap chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const latestDiagnostic = await diagnosticResult.findFirst({
      where: { userId },
      orderBy: { takenAt: 'desc' },
      select: {
        id: true,
        overallBand: true,
        listeningBand: true,
        readingBand: true,
        writingBand: true,
        speakingBand: true,
        weakSkills: true,
        expiresAt: true,
      },
    });

    if (!latestDiagnostic) {
      return NextResponse.json(
        { error: 'Bạn cần làm Diagnostic Placement Test trước khi tạo roadmap.' },
        { status: 428 }
      );
    }

    if (isDiagnosticExpired(latestDiagnostic.expiresAt.toISOString())) {
      return NextResponse.json(
        { error: 'Diagnostic đã hết hạn. Vui lòng làm lại bài test đầu vào để tạo roadmap mới.', needsRetake: true },
        { status: 409 }
      );
    }

    const diagnosticSkillBands = {
      listening: latestDiagnostic.listeningBand,
      reading: latestDiagnostic.readingBand,
      writing: latestDiagnostic.writingBand,
      speaking: latestDiagnostic.speakingBand,
    };

    const weakSkillsFromDb = toPlacementSkillKeys(latestDiagnostic.weakSkills);
    const weakSkills = weakSkillsFromDb.length > 0 ? weakSkillsFromDb : deriveWeakSkillsFromBands(diagnosticSkillBands);

    const blueprint = buildRoadmapBlueprint({
      diagnosticBands: diagnosticSkillBands,
      diagnosticOverallBand: latestDiagnostic.overallBand,
      weakSkills,
      targetBandScore: payload.targetBandScore,
      availableTimePerWeek: payload.availableTimePerWeek,
    });

    const skillGaps = blueprint.skillGapsSummary;
    let aiPlan:
      | {
          estimatedTimeline: string;
          weeklyStudyPlan: string;
          suggestedResources: string;
        }
      | null = null;

    try {
      aiPlan = await generatePersonalizedRoadmap({
        diagnosticOverallBand: latestDiagnostic.overallBand,
        diagnosticSkillBands,
        targetBandScore: payload.targetBandScore,
        availableTimePerWeek: payload.availableTimePerWeek,
        skillGaps,
        studyMaterialsPreference: payload.studyMaterialsPreference || 'No specific preference',
      });
    } catch (error) {
      console.error('AI roadmap generation fallback to deterministic blueprint:', error);
    }

    const now = new Date();

    const createdPlan = await prisma.$transaction(async (tx) => {
      const txRoadmapPlan = getRoadmapPlanDelegate(tx);

      if (!txRoadmapPlan) {
        throw new Error('Roadmap delegate is unavailable in transaction context.');
      }

      await txRoadmapPlan.updateMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        data: {
          status: 'ARCHIVED',
        },
      });

      return txRoadmapPlan.create({
        data: {
          userId,
          diagnosticResultId: latestDiagnostic.id,
          status: 'ACTIVE',
          targetBandScore: payload.targetBandScore,
          availableTimePerWeek: payload.availableTimePerWeek,
          studyMaterialsPreference: payload.studyMaterialsPreference || null,
          skillGaps,
          estimatedTimeline: aiPlan?.estimatedTimeline || blueprint.estimatedTimeline,
          weeklyStudyPlanText:
            aiPlan?.weeklyStudyPlan ||
            `Generated ${blueprint.weekCount} weeks with weak-skill priority and weekly measurement tasks.`,
          suggestedResourcesText:
            aiPlan?.suggestedResources ||
            'Use Test Center for timed sections, AI Chat for writing/speaking feedback, plus Grammar and Vocabulary hubs for consolidation.',
          weeks: {
            create: blueprint.weeks.map((week) => {
              const dueDate = new Date(now.getTime() + week.weekIndex * 7 * 24 * 60 * 60 * 1000);

              return {
                weekIndex: week.weekIndex,
                phase: week.phase,
                focusSkills: week.focusSkills.map((skill) => placementSkillKeyToEnum[skill]),
                targetHours: week.targetHours,
                successCriteria: week.successCriteria,
                tasks: {
                  create: week.tasks.map((task) => ({
                    title: task.title,
                    skill: placementSkillKeyToEnum[task.skill],
                    taskType: task.taskType,
                    linkedPath: task.linkedPath,
                    estimatedMinutes: task.estimatedMinutes,
                    mandatory: task.mandatory,
                    dueDate,
                    status: 'TODO',
                  })),
                },
              };
            }),
          },
        },
        include: {
          weeks: {
            orderBy: { weekIndex: 'asc' },
            include: {
              tasks: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
          replanEvents: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
    });

    return NextResponse.json({
      plan: serializeRoadmapPlan(createdPlan),
      meta: {
        aiEnhanced: Boolean(aiPlan),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Dữ liệu tạo roadmap không hợp lệ.' },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể tạo roadmap.' }, { status: 500 });
  }
}
