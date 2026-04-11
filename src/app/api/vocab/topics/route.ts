import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  findExistingVocabularyCategory,
  getVocabularyCategoryStats,
  normalizeVocabularyCategory,
  normalizeVocabularyCategoryKey,
} from '@/lib/vocabulary';

const deleteTopicSchema = z.object({
  topic: z.string().trim().min(1, 'Vui long chon chu de.').max(120),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Ban can dang nhap.' }, { status: 401 });
    }

    const topicRows = await prisma.vocab.findMany({
      where: {
        category: { not: null },
      },
      select: { category: true },
    });

    const topics = getVocabularyCategoryStats(topicRows).map((entry) => ({
      topic: entry.category,
      count: entry.count,
    }));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Khong the lay danh sach chu de.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Ban can dang nhap.' }, { status: 401 });
    }

    const payload = deleteTopicSchema.parse(await req.json());

    const allVocab = await prisma.vocab.findMany({
      where: {
        category: { not: null },
      },
      select: {
        id: true,
        category: true,
      },
    });

    const existingTopics = allVocab
      .map((entry) => normalizeVocabularyCategory(entry.category))
      .filter(Boolean);

    const resolvedTopic =
      findExistingVocabularyCategory(payload.topic, existingTopics) || normalizeVocabularyCategory(payload.topic);
    const resolvedTopicKey = normalizeVocabularyCategoryKey(resolvedTopic);

    if (!resolvedTopicKey) {
      return NextResponse.json({ error: 'Chu de khong hop le.' }, { status: 400 });
    }

    const idsToDelete = allVocab
      .filter((entry) => normalizeVocabularyCategoryKey(entry.category) === resolvedTopicKey)
      .map((entry) => entry.id);

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'Khong tim thay chu de de xoa.' }, { status: 404 });
    }

    const deleted = await prisma.vocab.deleteMany({
      where: {
        id: {
          in: idsToDelete,
        },
      },
    });

    return NextResponse.json({
      success: true,
      topic: resolvedTopic,
      deletedCount: deleted.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Du lieu gui len khong hop le.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Khong the xoa chu de.' }, { status: 500 });
  }
}
