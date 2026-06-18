import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin';
import { normalizeGrammarTitle, slugifyGrammarTitle, uniqueTags } from '@/lib/grammar';

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

export async function GET() {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const grammarEntries = await prisma.grammarEntry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(grammarEntries);
  } catch (error) {
    console.error('Error fetching admin grammar:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách ngữ pháp.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const payload = createGrammarSchema.parse(await req.json());
    const title = normalizeGrammarTitle(payload.title);
    const slug = slugifyGrammarTitle(title);

    const duplicated = await prisma.grammarEntry.findFirst({
      where: {
        slug,
      },
      select: { id: true },
    });

    if (duplicated) {
      return NextResponse.json(
        { error: 'Chủ điểm ngữ pháp này đã tồn tại trong hệ thống. Vui lòng đặt tên khác.' },
        { status: 409 }
      );
    }

    const created = await prisma.grammarEntry.create({
      data: {
        userId: adminCheck.userId as string,
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
