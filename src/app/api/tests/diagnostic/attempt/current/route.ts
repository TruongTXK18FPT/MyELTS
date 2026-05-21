import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { GeneratedDiagnosticTestSchema, toPublicDiagnosticTest } from '@/lib/diagnostic-placement-test';
import { getDiagnosticAttemptDelegate } from '@/lib/roadmap-delegate';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const diagnosticAttempt = getDiagnosticAttemptDelegate();

    if (!diagnosticAttempt) {
      return NextResponse.json(
        { error: 'Hệ thống diagnostic chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const attempt = await diagnosticAttempt.findFirst({
      where: {
        userId: session.user.id,
        status: 'GENERATED',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        survey: true,
        generatedTest: true,
        provider: true,
        modelUsed: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ attempt: null });
    }

    const parsedTest = GeneratedDiagnosticTestSchema.safeParse(attempt.generatedTest);

    if (!parsedTest.success) {
      return NextResponse.json({ attempt: null });
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        createdAt: attempt.createdAt.toISOString(),
        survey: attempt.survey,
        test: toPublicDiagnosticTest(parsedTest.data),
        provider: attempt.provider,
        modelUsed: attempt.modelUsed,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể tải attempt diagnostic hiện tại.' }, { status: 500 });
  }
}
