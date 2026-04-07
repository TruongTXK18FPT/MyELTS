import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { buildVocabularyNotes } from '@/lib/vocabulary-seed';
import { capitalizeVocabularyWord, isVietnameseMeaning } from '@/lib/vocabulary';

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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const payload = createVocabSchema.parse(await req.json());
    const normalizedWord = capitalizeVocabularyWord(payload.word);

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
        category: payload.category || null,
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
        userId: session.user.id,
      }
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
