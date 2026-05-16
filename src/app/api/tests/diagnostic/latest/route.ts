import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getDiagnosticResultDelegate } from '@/lib/roadmap-delegate';
import { isDiagnosticExpired, toPlacementSkillKeys } from '@/lib/roadmap';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const diagnosticResult = getDiagnosticResultDelegate();

    if (!diagnosticResult) {
      return NextResponse.json(
        { error: 'Hệ thống roadmap chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const latest = await diagnosticResult.findFirst({
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
    });

    if (!latest) {
      return NextResponse.json({ diagnostic: null });
    }

    const expiresAtIso = latest.expiresAt.toISOString();

    return NextResponse.json({
      diagnostic: {
        id: latest.id,
        takenAt: latest.takenAt.toISOString(),
        expiresAt: expiresAtIso,
        isExpired: isDiagnosticExpired(expiresAtIso),
        overallBand: latest.overallBand,
        skillBands: {
          listening: latest.listeningBand,
          reading: latest.readingBand,
          writing: latest.writingBand,
          speaking: latest.speakingBand,
        },
        weakSkills: toPlacementSkillKeys(latest.weakSkills),
        strongSkills: toPlacementSkillKeys(latest.strongSkills),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể tải kết quả diagnostic gần nhất.' }, { status: 500 });
  }
}
