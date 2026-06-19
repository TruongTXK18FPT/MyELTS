import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/deep-workspace/tasks/[taskId] - Update task status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { status, actualMinutes } = body;

    // Verify ownership through dailyPlan -> deepPlan -> user
    const task = await prisma.planTask2.findFirst({
      where: { id: taskId },
      include: {
        dailyPlan: {
          include: { deepPlan: { select: { userId: true } } },
        },
      },
    });

    if (!task || task.dailyPlan.deepPlan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Không tìm thấy task' }, { status: 404 });
    }

    const updated = await prisma.planTask2.update({
      where: { id: taskId },
      data: {
        ...(status ? { status } : {}),
        ...(actualMinutes !== undefined ? { actualMinutes } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });

    // Recalculate daily plan completion rate
    const allTasks = await prisma.planTask2.findMany({
      where: { dailyPlanId: task.dailyPlanId },
    });

    const completedCount = allTasks.filter(t =>
      t.id === taskId ? status === 'COMPLETED' : t.status === 'COMPLETED'
    ).length;

    const completionRate = allTasks.length > 0
      ? Math.round((completedCount / allTasks.length) * 100)
      : 0;

    await prisma.dailyPlan.update({
      where: { id: task.dailyPlanId },
      data: { completionRate },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /tasks/[taskId] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
