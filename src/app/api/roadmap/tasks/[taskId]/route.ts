import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { getRoadmapPlanDelegate, getRoadmapTaskDelegate } from '@/lib/roadmap-delegate';
import { serializeRoadmapPlan } from '@/lib/roadmap-serialization';

const updateTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
  notes: z.string().trim().max(1500).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const roadmapTask = getRoadmapTaskDelegate();
    const roadmapPlan = getRoadmapPlanDelegate();

    if (!roadmapTask || !roadmapPlan) {
      return NextResponse.json(
        { error: 'Hệ thống roadmap chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const { taskId } = await params;
    const payload = updateTaskSchema.parse(await req.json());

    const task = await roadmapTask.findUnique({
      where: { id: taskId },
      include: {
        roadmapWeek: {
          select: {
            roadmapPlanId: true,
            roadmapPlan: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Không tìm thấy roadmap task.' }, { status: 404 });
    }

    if (task.roadmapWeek.roadmapPlan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền cập nhật task này.' }, { status: 403 });
    }

    await roadmapTask.update({
      where: { id: taskId },
      data: {
        status: payload.status,
        notes: payload.notes || null,
        completedAt: payload.status === 'COMPLETED' ? new Date() : null,
      },
    });

    const activePlan = await roadmapPlan.findFirst({
      where: {
        id: task.roadmapWeek.roadmapPlanId,
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

    if (!activePlan) {
      return NextResponse.json({ error: 'Không tìm thấy roadmap plan tương ứng.' }, { status: 404 });
    }

    return NextResponse.json({
      plan: serializeRoadmapPlan(activePlan),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu task không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể cập nhật task roadmap.' }, { status: 500 });
  }
}
