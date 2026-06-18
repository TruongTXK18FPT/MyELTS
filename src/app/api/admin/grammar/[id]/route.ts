import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin';
import { normalizeGrammarTitle, slugifyGrammarTitle, uniqueTags } from '@/lib/grammar';

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

export async function PUT(req: Request, context: RouteContext) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await context.params;
    const payload = updateGrammarSchema.parse(await req.json());
    const title = normalizeGrammarTitle(payload.title);
    const slug = slugifyGrammarTitle(title);

    const target = await prisma.grammarEntry.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'Không tìm thấy điểm ngữ pháp để cập nhật.' }, { status: 404 });
    }

    const duplicated = await prisma.grammarEntry.findFirst({
      where: {
        id: { not: id },
        slug,
      },
      select: { id: true },
    });

    if (duplicated) {
      return NextResponse.json(
        { error: 'Chủ điểm ngữ pháp này đã trùng tên với một chủ điểm khác.' },
        { status: 409 }
      );
    }

    const updated = await prisma.grammarEntry.update({
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

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await context.params;

    const deleted = await prisma.grammarEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: `Điểm ngữ pháp "${deleted.title}" đã được xóa.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể xóa điểm ngữ pháp.' }, { status: 500 });
  }
}
