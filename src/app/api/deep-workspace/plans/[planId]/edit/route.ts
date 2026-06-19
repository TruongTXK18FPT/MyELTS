import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { refinePlan, type PlanGenerationOutput } from '@/ai/flows/deep-plan-generation';

// POST /api/deep-workspace/plans/[planId]/edit - Send edit request
export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;
    const body = await req.json();
    const { editMessage } = body;

    if (!editMessage) {
      return NextResponse.json({ error: 'Thiếu yêu cầu chỉnh sửa' }, { status: 400 });
    }

    // Get current plan
    const plan = await prisma.deepPlan.findFirst({
      where: { id: planId, userId: session.user.id },
      include: {
        dailyPlans: {
          include: { tasks: { orderBy: { order: 'asc' } } },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Không tìm thấy kế hoạch' }, { status: 404 });
    }

    // Build current plan representation for AI
    const currentPlan: PlanGenerationOutput = {
      title: plan.title,
      description: plan.description || '',
      subTopics: plan.subTopics,
      dailyPlans: plan.dailyPlans.map(dp => ({
        date: dp.date.toISOString().split('T')[0],
        summary: '',
        tasks: dp.tasks.map(t => ({
          title: t.title,
          description: t.description || '',
          knowledgeArea: t.knowledgeArea,
          estimatedMinutes: t.estimatedMinutes,
          priority: t.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          resources: (t.resources as { type: string; title: string; url?: string }[]) || [],
        })),
      })),
    };

    // Refine with AI
    const refined = await refinePlan(currentPlan, editMessage);

    // Update plan in database
    // First delete old daily plans & tasks
    await prisma.dailyPlan.deleteMany({
      where: { deepPlanId: planId },
    });

    // Create new ones
    const updated = await prisma.deepPlan.update({
      where: { id: planId },
      data: {
        title: refined.title,
        description: refined.description,
        subTopics: refined.subTopics,
        status: 'DRAFT', // Back to DRAFT after edit
        dailyPlans: {
          create: refined.dailyPlans.map((dp) => ({
            user: { connect: { id: session.user.id } },
            date: new Date(dp.date),
            timeSlotStart: plan.dailyPlans[0]?.timeSlotStart || '09:00',
            timeSlotEnd: plan.dailyPlans[0]?.timeSlotEnd || '17:00',
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
          include: { tasks: { orderBy: { order: 'asc' } } },
          orderBy: { date: 'asc' },
        },
      },
    });

    // Save edit request for history
    await prisma.planEditRequest.create({
      data: {
        deepPlanId: planId,
        userMessage: editMessage,
        aiResponse: JSON.stringify(refined),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('POST /plans/[planId]/edit error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
