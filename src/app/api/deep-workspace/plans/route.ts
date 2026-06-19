import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateDeepPlan } from '@/ai/flows/deep-plan-generation';

// GET /api/deep-workspace/plans - List user's plans
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prisma.deepPlan.findMany({
      where: { userId: session.user.id },
      include: {
        dailyPlans: {
          include: { tasks: true },
          orderBy: { date: 'asc' },
        },
        _count: { select: { dailyPlans: true, editRequests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('GET /api/deep-workspace/plans error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/deep-workspace/plans - Create new plan (AI generation)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topic, description, startDate, timeSlotStart, timeSlotEnd, numberOfDays } = body;

    if (!topic || !startDate || !timeSlotStart || !timeSlotEnd || !numberOfDays) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Generate plan with AI
    const aiPlan = await generateDeepPlan({
      userId: session.user.id,
      topic,
      description: description || topic,
      startDate,
      timeSlotStart,
      timeSlotEnd,
      numberOfDays: Math.min(numberOfDays, 30),
    });

    // Save as DRAFT (NOT auto-approved)
    const deepPlan = await prisma.deepPlan.create({
      data: {
        userId: session.user.id,
        title: aiPlan.title,
        description: aiPlan.description,
        topic,
        subTopics: aiPlan.subTopics,
        status: 'DRAFT',
        startDate: new Date(startDate),
        endDate: aiPlan.dailyPlans.length > 0
          ? new Date(aiPlan.dailyPlans[aiPlan.dailyPlans.length - 1].date)
          : null,
        dailyPlans: {
          create: aiPlan.dailyPlans.map((dp) => ({
            user: { connect: { id: session.user.id } },
            date: new Date(dp.date),
            timeSlotStart,
            timeSlotEnd,
            status: 'DRAFT' as const,
            aiSuggestion: dp as object,
            tasks: {
              create: dp.tasks.map((task, idx) => ({
                title: task.title,
                description: task.description,
                knowledgeArea: task.knowledgeArea,
                estimatedMinutes: task.estimatedMinutes,
                priority: task.priority,
                order: idx,
                aiGenerated: true,
                resources: task.resources as object,
              })),
            },
          })),
        },
      },
      include: {
        dailyPlans: {
          include: { tasks: true },
          orderBy: { date: 'asc' },
        },
      },
    });

    return NextResponse.json(deepPlan);
  } catch (error) {
    console.error('POST /api/deep-workspace/plans error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
