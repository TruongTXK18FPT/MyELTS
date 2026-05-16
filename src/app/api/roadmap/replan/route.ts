import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import {
  getRoadmapPlanDelegate,
  getRoadmapReplanEventDelegate,
  getRoadmapTaskDelegate,
  getRoadmapWeekDelegate,
} from '@/lib/roadmap-delegate';
import { prisma } from '@/lib/prisma';
import { serializeRoadmapPlan } from '@/lib/roadmap-serialization';

const replanSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

type ReplanTaskRecord = {
  id: string;
  estimatedMinutes: number;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
};

type ReplanWeekRecord = {
  id: string;
  weekIndex: number;
  targetHours: number;
  tasks: ReplanTaskRecord[];
};

type ReplanPlanRecord = {
  id: string;
  weeks: ReplanWeekRecord[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const roadmapPlan = getRoadmapPlanDelegate();
    const roadmapTask = getRoadmapTaskDelegate();
    const roadmapWeek = getRoadmapWeekDelegate();
    const roadmapReplanEvent = getRoadmapReplanEventDelegate();

    if (!roadmapPlan || !roadmapTask || !roadmapWeek || !roadmapReplanEvent) {
      return NextResponse.json(
        { error: 'Hệ thống roadmap chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const payload = replanSchema.parse(await req.json());

    const activePlan = await roadmapPlan.findFirst<ReplanPlanRecord>({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        weeks: {
          orderBy: { weekIndex: 'asc' },
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!activePlan) {
      return NextResponse.json({ error: 'Bạn chưa có roadmap active để replan.' }, { status: 404 });
    }

    const weekCompletionRates = activePlan.weeks.map((week) => {
      const total = week.tasks.length;
      const completed = week.tasks.filter((task) => task.status === 'COMPLETED').length;
      const rate = total === 0 ? 0 : completed / total;

      return {
        weekId: week.id,
        weekIndex: week.weekIndex,
        rate,
      };
    });

    const recentTwo = weekCompletionRates.slice(-2);
    const overallCompletionRate =
      weekCompletionRates.length > 0
        ? weekCompletionRates.reduce((sum, week) => sum + week.rate, 0) / weekCompletionRates.length
        : 0;

    let adjustmentPercent = 0;
    let summary = 'No workload adjustment is needed right now.';

    if (recentTwo.length >= 2 && recentTwo.every((week) => week.rate < 0.6)) {
      adjustmentPercent = -20;
      summary = 'Two consecutive weeks below 60% completion. Reduced workload by 20% for pending tasks.';
    } else if (recentTwo.length >= 2 && recentTwo.every((week) => week.rate > 0.85)) {
      adjustmentPercent = 10;
      summary = 'Two strong weeks above 85% completion. Increased challenge by 10% for pending tasks.';
    }

    if (adjustmentPercent !== 0) {
      const pendingTasks = activePlan.weeks.flatMap((week) =>
        week.tasks.filter((task) => task.status !== 'COMPLETED')
      );

      await prisma.$transaction(async (tx) => {
        const txRoadmapTask = getRoadmapTaskDelegate(tx);
        const txRoadmapWeek = getRoadmapWeekDelegate(tx);
        const txRoadmapReplanEvent = getRoadmapReplanEventDelegate(tx);

        if (!txRoadmapTask || !txRoadmapWeek || !txRoadmapReplanEvent) {
          throw new Error('Roadmap delegates are unavailable in transaction context.');
        }

        for (const task of pendingTasks) {
          const nextMinutes = clamp(
            Math.round(task.estimatedMinutes * (1 + adjustmentPercent / 100)),
            20,
            180
          );

          await txRoadmapTask.update({
            where: { id: task.id },
            data: {
              estimatedMinutes: nextMinutes,
            },
          });
        }

        for (const week of activePlan.weeks) {
          const nextTargetHours = clamp(
            Math.round(week.targetHours * (1 + adjustmentPercent / 100)),
            3,
            40
          );

          await txRoadmapWeek.update({
            where: { id: week.id },
            data: {
              targetHours: nextTargetHours,
            },
          });
        }

        await txRoadmapReplanEvent.create({
          data: {
            roadmapPlanId: activePlan.id,
            reason: payload.reason || 'manual_replan',
            completionRate: overallCompletionRate,
            adjustmentPercent,
            summary,
          },
        });
      });
    } else {
      await roadmapReplanEvent.create({
        data: {
          roadmapPlanId: activePlan.id,
          reason: payload.reason || 'manual_replan',
          completionRate: overallCompletionRate,
          adjustmentPercent,
          summary,
        },
      });
    }

    const refreshedPlan = await roadmapPlan.findFirst({
      where: {
        id: activePlan.id,
        userId: session.user.id,
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
          take: 8,
        },
      },
    });

    if (!refreshedPlan) {
      return NextResponse.json({ error: 'Không thể tải roadmap sau khi replan.' }, { status: 500 });
    }

    return NextResponse.json({
      plan: serializeRoadmapPlan(refreshedPlan),
      meta: {
        adjustmentPercent,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Dữ liệu replan không hợp lệ.' },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể replan roadmap.' }, { status: 500 });
  }
}
