import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/deep-workspace/plans/[planId] - Get plan detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;

    const plan = await prisma.deepPlan.findFirst({
      where: { id: planId, userId: session.user.id },
      include: {
        dailyPlans: {
          include: { tasks: { orderBy: { order: 'asc' } }, notes: true },
          orderBy: { date: 'asc' },
        },
        editRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Không tìm thấy kế hoạch' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('GET /plans/[planId] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PATCH /api/deep-workspace/plans/[planId] - Update plan status
export async function PATCH(
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
    const { status } = body;

    // Verify ownership
    const existing = await prisma.deepPlan.findFirst({
      where: { id: planId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy kế hoạch' }, { status: 404 });
    }

    const updated = await prisma.deepPlan.update({
      where: { id: planId },
      data: {
        status,
        ...(status === 'APPROVED' ? {
          dailyPlans: {
            updateMany: {
              where: { status: 'DRAFT' },
              data: { status: 'APPROVED' },
            },
          },
        } : {}),
      },
      include: {
        dailyPlans: {
          include: { tasks: true },
          orderBy: { date: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /plans/[planId] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/deep-workspace/plans/[planId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;

    await prisma.deepPlan.deleteMany({
      where: { id: planId, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /plans/[planId] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
