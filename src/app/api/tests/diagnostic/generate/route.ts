import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

import { auth } from '@/auth';
import { generateDiagnosticTestWithMistral } from '@/lib/diagnostic-ai';
import { DiagnosticSurveySchema, toPublicDiagnosticTest } from '@/lib/diagnostic-placement-test';
import { getDiagnosticAttemptDelegate } from '@/lib/roadmap-delegate';

const generateDiagnosticSchema = z.object({
  survey: DiagnosticSurveySchema,
});

function asJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để tạo bài test đầu vào.' }, { status: 401 });
    }

    const payload = generateDiagnosticSchema.parse(await req.json());
    const diagnosticAttempt = getDiagnosticAttemptDelegate();

    if (!diagnosticAttempt) {
      return NextResponse.json(
        { error: 'Hệ thống diagnostic chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const generated = await generateDiagnosticTestWithMistral(payload.survey);

    const attempt = await diagnosticAttempt.create({
      data: {
        userId: session.user.id,
        ieltsType: 'ACADEMIC',
        status: 'GENERATED',
        survey: asJsonValue(payload.survey),
        generatedTest: asJsonValue(generated.test),
        provider: generated.provider,
        modelUsed: generated.modelUsed,
      },
      select: {
        id: true,
        createdAt: true,
        survey: true,
        generatedTest: true,
        provider: true,
        modelUsed: true,
      },
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        createdAt: attempt.createdAt.toISOString(),
        survey: attempt.survey,
        test: toPublicDiagnosticTest(generated.test),
        provider: attempt.provider,
        modelUsed: attempt.modelUsed,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Dữ liệu khảo sát không hợp lệ.' },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message.includes('MISTRAL_API_KEY')) {
      return NextResponse.json(
        { error: 'Thiếu MISTRAL_API_KEY. Vui lòng cấu hình key Mistral trước khi tạo diagnostic AI.' },
        { status: 500 }
      );
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể tạo bài diagnostic bằng AI lúc này.' }, { status: 500 });
  }
}
