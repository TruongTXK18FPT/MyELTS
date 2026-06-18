import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin';
import { buildVocabularyNotes } from '@/lib/vocabulary-seed';
import {
  capitalizeVocabularyWord,
  isVietnameseMeaning,
  normalizeVocabularyCategory,
  resolveVocabularyCategory,
} from '@/lib/vocabulary';

type RouteParams = { id: string };
type RouteContext = { params: Promise<RouteParams> };

const nullableLimited = (max: number) => z.string().trim().max(max).nullable().optional();

const updateVocabSchema = z.object({
  word: z.string().trim().min(1, 'Từ vựng là bắt buộc.').max(120),
  image: z.string().trim().url().nullable().optional(),
  grammar: nullableLimited(120),
  pronunciation: nullableLimited(160),
  category: nullableLimited(120),
  meaning: nullableLimited(1200).refine((value) => isVietnameseMeaning(value), {
    message: 'Nghĩa cần được nhập bằng tiếng Việt.',
  }),
  example: nullableLimited(1400),
  usageContext: nullableLimited(1400),
  note: nullableLimited(1800),
  synonym: nullableLimited(600),
  antonym: nullableLimited(600),
  singularForm: nullableLimited(120),
  pluralForm: nullableLimited(120),
  v2Form: nullableLimited(120),
  v3Form: nullableLimited(120),
  notes: nullableLimited(3000),
});

export async function PUT(req: Request, context: RouteContext) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await context.params;
    const payload = updateVocabSchema.parse(await req.json());
    const normalizedWord = capitalizeVocabularyWord(payload.word);

    const targetVocab = await prisma.vocab.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!targetVocab) {
      return NextResponse.json({ error: 'Không tìm thấy từ vựng để cập nhật.' }, { status: 404 });
    }

    const duplicated = await prisma.vocab.findFirst({
      where: {
        id: { not: id },
        word: {
          equals: normalizedWord,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (duplicated) {
      return NextResponse.json({ error: 'Từ vựng này đã tồn tại trong hệ thống.' }, { status: 409 });
    }

    const existingCategories = (
      await prisma.vocab.findMany({
        where: {
          category: { not: null },
        },
        select: { category: true },
      })
    )
      .map((entry) => normalizeVocabularyCategory(entry.category))
      .filter(Boolean);

    const resolvedCategory = resolveVocabularyCategory(payload.category, existingCategories);

    const legacyNotes =
      payload.notes ||
      buildVocabularyNotes({
        meaning: payload.meaning,
        example: payload.example,
        usageContext: payload.usageContext,
        note: payload.note,
        synonym: payload.synonym,
        antonym: payload.antonym,
        singularForm: payload.singularForm,
        pluralForm: payload.pluralForm,
        v2Form: payload.v2Form,
        v3Form: payload.v3Form,
      }) ||
      null;

    const updated = await prisma.vocab.update({
      where: { id },
      data: {
        word: normalizedWord,
        image: payload.image || null,
        grammar: payload.grammar || null,
        pronunciation: payload.pronunciation || null,
        category: resolvedCategory,
        meaning: payload.meaning || null,
        example: payload.example || null,
        usageContext: payload.usageContext || null,
        note: payload.note || null,
        synonym: payload.synonym || null,
        antonym: payload.antonym || null,
        singularForm: payload.singularForm || null,
        pluralForm: payload.pluralForm || null,
        v2Form: payload.v2Form || null,
        v3Form: payload.v3Form || null,
        notes: legacyNotes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể cập nhật từ vựng.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await context.params;

    const deleted = await prisma.vocab.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: `Từ vựng "${deleted.word}" đã được xóa.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể xóa từ vựng.' }, { status: 500 });
  }
}
