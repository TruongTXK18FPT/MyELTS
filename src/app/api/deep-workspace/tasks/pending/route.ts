import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/deep-workspace/tasks/pending - Lấy danh sách nhiệm vụ chưa hoàn thành
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await prisma.planTask2.findMany({
      where: {
        status: { not: 'COMPLETED' },
        dailyPlan: {
          userId: session.user.id,
        },
      },
      include: {
        dailyPlan: {
          select: {
            date: true,
            deepPlan: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: [
        { dailyPlan: { date: 'asc' } },
        { priority: 'desc' },
        { order: 'asc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /api/deep-workspace/tasks/pending error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
