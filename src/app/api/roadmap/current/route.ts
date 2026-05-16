import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getDiagnosticResultDelegate, getRoadmapPlanDelegate } from '@/lib/roadmap-delegate';
import { serializeDiagnosticRecord, serializeRoadmapPlan } from '@/lib/roadmap-serialization';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const diagnosticResult = getDiagnosticResultDelegate();
    const roadmapPlan = getRoadmapPlanDelegate();

    if (!diagnosticResult || !roadmapPlan) {
      return NextResponse.json(
        { error: 'Hệ thống roadmap chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const [latestDiagnostic, activePlan] = await Promise.all([
      diagnosticResult.findFirst({
        where: { userId: session.user.id },
        orderBy: { takenAt: 'desc' },
        select: {
          id: true,
          takenAt: true,
          expiresAt: true,
          overallBand: true,
          listeningBand: true,
          readingBand: true,
          writingBand: true,
          speakingBand: true,
          weakSkills: true,
          strongSkills: true,
        },
      }),
      roadmapPlan.findFirst({
        where: {
          userId: session.user.id,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
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
      }),
    ]);

    return NextResponse.json({
      diagnostic: latestDiagnostic ? serializeDiagnosticRecord(latestDiagnostic) : null,
      plan: activePlan ? serializeRoadmapPlan(activePlan) : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể tải roadmap hiện tại.' }, { status: 500 });
  }
}
