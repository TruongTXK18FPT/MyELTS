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

const nullableLimited = (max: number) => z.string().trim().max(max).nullable().optional();

const createVocabSchema = z.object({
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

export async function GET(req: Request) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { meaning: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const [vocabs, total] = await Promise.all([
      prisma.vocab.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.vocab.count({ where }),
    ]);

    // Fetch list of unique categories for filters
    const categories = await prisma.vocab.groupBy({
      by: ['category'],
      where: { category: { not: null } },
    });

    return NextResponse.json({
      vocabs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      categories: categories.map((c) => c.category).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching admin vocab:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách từ vựng.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const payload = createVocabSchema.parse(await req.json());
    const normalizedWord = capitalizeVocabularyWord(payload.word);

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

    const existing = await prisma.vocab.findFirst({
      where: {
        word: {
          equals: normalizedWord,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: 'Từ vựng này đã tồn tại trong hệ thống.' }, { status: 409 });
    }

    const vocab = await prisma.vocab.create({
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
        userId: adminCheck.userId as string,
      },
    });

    return NextResponse.json(vocab, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể tạo từ vựng.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    // Delete all vocabularies in the system
    const result = await prisma.vocab.deleteMany({});

    return NextResponse.json({ success: true, message: `Đã xóa toàn bộ ${result.count} từ vựng.` });
  } catch (error) {
    console.error('Error clearing vocabs:', error);
    return NextResponse.json({ error: 'Không thể xóa toàn bộ từ vựng.' }, { status: 500 });
  }
}
