import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getGrammarEntryDelegate } from '@/lib/grammar-entry-delegate';
import { getGrammarStudyProgressDelegate } from '@/lib/grammar-study-progress-delegate';

const upsertProgressSchema = z.object({
  grammarEntryId: z.string().trim().min(1, 'Thiếu grammarEntryId.'),
  isCompleted: z.boolean(),
});

export async function GET() {
  try {
    const grammarStudyProgress = getGrammarStudyProgressDelegate();

    if (!grammarStudyProgress) {
      return NextResponse.json(
        { error: 'Hệ thống grammar chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const rows = await grammarStudyProgress.findMany<{
      grammarEntryId: string;
      isCompleted: boolean;
      completedAt: Date | null;
    }>({
      where: { userId: session.user.id },
      select: {
        grammarEntryId: true,
        isCompleted: true,
        completedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      items: rows.map((row) => ({
        grammarEntryId: row.grammarEntryId,
        isCompleted: row.isCompleted,
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể tải tiến độ Study Path.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const grammarEntry = getGrammarEntryDelegate();
    const grammarStudyProgress = getGrammarStudyProgressDelegate();

    if (!grammarEntry || !grammarStudyProgress) {
      return NextResponse.json(
        { error: 'Hệ thống grammar chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const payload = upsertProgressSchema.parse(await req.json());

    const ownedGrammar = await grammarEntry.findFirst<{ id: string }>({
      where: {
        id: payload.grammarEntryId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!ownedGrammar) {
      return NextResponse.json({ error: 'Không tìm thấy chủ điểm ngữ pháp hợp lệ để lưu tiến độ.' }, { status: 404 });
    }

    const progress = await grammarStudyProgress.upsert<{
      grammarEntryId: string;
      isCompleted: boolean;
      completedAt: Date | null;
    }>({
      where: {
        userId_grammarEntryId: {
          userId: session.user.id,
          grammarEntryId: payload.grammarEntryId,
        },
      },
      update: {
        isCompleted: payload.isCompleted,
        completedAt: payload.isCompleted ? new Date() : null,
      },
      create: {
        userId: session.user.id,
        grammarEntryId: payload.grammarEntryId,
        isCompleted: payload.isCompleted,
        completedAt: payload.isCompleted ? new Date() : null,
      },
      select: {
        grammarEntryId: true,
        isCompleted: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      item: {
        grammarEntryId: progress.grammarEntryId,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt ? progress.completedAt.toISOString() : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể lưu tiến độ Study Path.' }, { status: 500 });
  }
}
