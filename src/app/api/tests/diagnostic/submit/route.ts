import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import {
  evaluatePlacementAnswers,
  placementQuestions,
} from '@/lib/diagnostic-placement-test';
import { getDiagnosticResultDelegate } from '@/lib/roadmap-delegate';
import { placementSkillKeyToEnum } from '@/lib/roadmap';

const submitDiagnosticSchema = z.object({
  answers: z.record(z.string().trim().min(1, 'Answer option is required.')),
});

const DIAGNOSTIC_EXPIRY_DAYS = 30;

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để lưu kết quả diagnostic.' }, { status: 401 });
    }

    const payload = submitDiagnosticSchema.parse(await req.json());
    const answeredCount = Object.keys(payload.answers).length;

    if (answeredCount < placementQuestions.length) {
      return NextResponse.json(
        { error: 'Bạn cần hoàn thành tất cả câu hỏi diagnostic trước khi nộp bài.' },
        { status: 400 }
      );
    }

    const result = evaluatePlacementAnswers(payload.answers);
    const takenAt = new Date();
    const expiresAt = new Date(takenAt.getTime() + DIAGNOSTIC_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const diagnosticResult = getDiagnosticResultDelegate();

    if (!diagnosticResult) {
      return NextResponse.json(
        { error: 'Hệ thống roadmap chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const created = await diagnosticResult.create({
      data: {
        userId: session.user.id,
        takenAt,
        expiresAt,
        overallBand: result.overallBand,
        listeningBand: result.skillResults.listening.band,
        readingBand: result.skillResults.reading.band,
        writingBand: result.skillResults.writing.band,
        speakingBand: result.skillResults.speaking.band,
        weakSkills: result.weakSkills.map((skill) => placementSkillKeyToEnum[skill]),
        strongSkills: result.strongSkills.map((skill) => placementSkillKeyToEnum[skill]),
        rawAnswers: payload.answers,
      },
      select: {
        id: true,
        takenAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({
      diagnostic: {
        id: created.id,
        takenAt: created.takenAt.toISOString(),
        expiresAt: created.expiresAt.toISOString(),
      },
      result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Dữ liệu diagnostic không hợp lệ.' },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể lưu kết quả diagnostic.' }, { status: 500 });
  }
}
