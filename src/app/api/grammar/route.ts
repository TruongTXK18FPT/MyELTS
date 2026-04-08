import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { normalizeGrammarTitle, slugifyGrammarTitle, uniqueTags } from '@/lib/grammar';
import { getGrammarEntryDelegate } from '@/lib/grammar-entry-delegate';

const nullableLimited = (max: number) => z.string().trim().max(max).nullable().optional();

const createGrammarSchema = z.object({
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

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const payload = createGrammarSchema.parse(await req.json());
    const title = normalizeGrammarTitle(payload.title);
    const slug = slugifyGrammarTitle(title);

    const grammarEntry = getGrammarEntryDelegate();

    if (!grammarEntry) {
      return NextResponse.json(
        { error: 'Dữ liệu ngữ pháp chưa sẵn sàng. Vui lòng khởi động lại server hoặc chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const duplicated = await grammarEntry.findFirst({
      where: {
        userId: session.user.id,
        slug,
      },
      select: { id: true },
    });

    if (duplicated) {
      return NextResponse.json(
        { error: 'Điểm ngữ pháp này đã tồn tại. Hãy đặt tên khác để phân biệt.' },
        { status: 409 }
      );
    }

    const created = await grammarEntry.create({
      data: {
        userId: session.user.id,
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

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể tạo điểm ngữ pháp.' }, { status: 500 });
  }
}
