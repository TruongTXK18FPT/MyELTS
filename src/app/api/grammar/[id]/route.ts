import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { normalizeGrammarTitle, slugifyGrammarTitle, uniqueTags } from '@/lib/grammar';
import { GRAMMAR_SEED_LOCK_SLUG } from '@/lib/grammar-data';
import { getGrammarEntryDelegate } from '@/lib/grammar-entry-delegate';

type RouteParams = { id: string };
type RouteContext = { params: Promise<RouteParams> };

const nullableLimited = (max: number) => z.string().trim().max(max).nullable().optional();

const updateGrammarSchema = z.object({
  title: z.string().trim().min(2, 'Tên điểm ngữ pháp là bắt buộc.').max(160),
  grammarType: nullableLimited(120),
  level: nullableLimited(40),
  explanation: z.string().trim().min(10, 'Nội dung giải thích quá ngắn.').max(4000),
  usageGuide: nullableLimited(5000),
  structurePattern: nullableLimited(1200),
  exampleSentence: nullableLimited(1800),
  storyExample: nullableLimited(4000),
  practiceHint: nullableLimited(2200),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
});

async function getRouteId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.id;
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const id = await getRouteId(context);
    const payload = updateGrammarSchema.parse(await req.json());

    const grammarEntry = getGrammarEntryDelegate();

    if (!grammarEntry) {
      return NextResponse.json(
        { error: 'Dữ liệu ngữ pháp chưa sẵn sàng. Vui lòng khởi động lại server hoặc chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const ownedEntry = await grammarEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
        slug: {
          not: GRAMMAR_SEED_LOCK_SLUG,
        },
      },
      select: { id: true },
    });

    if (!ownedEntry) {
      return NextResponse.json({ error: 'Không tìm thấy mục ngữ pháp để cập nhật.' }, { status: 404 });
    }

    const title = normalizeGrammarTitle(payload.title);
    const slug = slugifyGrammarTitle(title);

    const duplicated = await grammarEntry.findFirst({
      where: {
        userId: session.user.id,
        slug,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicated) {
      return NextResponse.json(
        { error: 'Điểm ngữ pháp này đã tồn tại. Hãy đổi tên để tránh trùng.' },
        { status: 409 }
      );
    }

    const updated = await grammarEntry.update({
      where: { id },
      data: {
        title,
        slug,
        grammarType: payload.grammarType || null,
        level: payload.level || null,
        explanation: payload.explanation,
        usageGuide: payload.usageGuide || null,
        structurePattern: payload.structurePattern || null,
        exampleSentence: payload.exampleSentence || null,
        storyExample: payload.storyExample || null,
        practiceHint: payload.practiceHint || null,
        tags: uniqueTags(payload.tags),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể cập nhật điểm ngữ pháp.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const id = await getRouteId(context);

    const grammarEntry = getGrammarEntryDelegate();

    if (!grammarEntry) {
      return NextResponse.json(
        { error: 'Dữ liệu ngữ pháp chưa sẵn sàng. Vui lòng khởi động lại server hoặc chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const deleted = await grammarEntry.deleteMany({
      where: {
        id,
        userId: session.user.id,
        slug: {
          not: GRAMMAR_SEED_LOCK_SLUG,
        },
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Không tìm thấy mục ngữ pháp để xóa.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể xóa điểm ngữ pháp.' }, { status: 500 });
  }
}
