import { VocabularyHeader } from '@/components/vocabulary/VocabularyHeader';
import { VocabularyManager } from '@/components/vocabulary/VocabularyManager';
import type { VocabularyItem } from '@/components/vocabulary/VocabularyList';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { buildVocabularyNotes, vocabularySeedEntries } from '@/lib/vocabulary-seed';

async function seedVocabularyForUser(userId: string) {
  const vocabCount = await prisma.vocab.count();

  if (vocabCount > 0) {
    return;
  }

  await prisma.vocab.createMany({
    data: vocabularySeedEntries.map((entry) => ({
      userId,
      word: entry.word,
      pronunciation: entry.pronunciation || null,
      grammar: entry.grammar || null,
      category: entry.category || null,
      meaning: entry.meaning || null,
      example: entry.example || null,
      usageContext: entry.usageContext || null,
      note: entry.note || null,
      synonym: entry.synonym || null,
      antonym: entry.antonym || null,
      singularForm: entry.singularForm || null,
      pluralForm: entry.pluralForm || null,
      v2Form: entry.v2Form || null,
      v3Form: entry.v3Form || null,
      notes: buildVocabularyNotes({
        meaning: entry.meaning,
        example: entry.example,
        usageContext: entry.usageContext,
        note: entry.note,
        synonym: entry.synonym,
        antonym: entry.antonym,
        singularForm: entry.singularForm,
        pluralForm: entry.pluralForm,
        v2Form: entry.v2Form,
        v3Form: entry.v3Form,
        notes: entry.notes,
      }) || null,
      image: null,
    })),
  });
}

function mapSeedToVocabularyItems(): VocabularyItem[] {
  return vocabularySeedEntries.map((entry, index) => ({
    id: `seed-${index + 1}`,
    word: entry.word,
    pronunciation: entry.pronunciation || null,
    grammar: entry.grammar || null,
    category: entry.category || null,
    meaning: entry.meaning || null,
    example: entry.example || null,
    usageContext: entry.usageContext || null,
    note: entry.note || null,
    synonym: entry.synonym || null,
    antonym: entry.antonym || null,
    singularForm: entry.singularForm || null,
    pluralForm: entry.pluralForm || null,
    v2Form: entry.v2Form || null,
    v3Form: entry.v3Form || null,
    notes: buildVocabularyNotes({
      meaning: entry.meaning,
      example: entry.example,
      usageContext: entry.usageContext,
      note: entry.note,
      synonym: entry.synonym,
      antonym: entry.antonym,
      singularForm: entry.singularForm,
      pluralForm: entry.pluralForm,
      v2Form: entry.v2Form,
      v3Form: entry.v3Form,
      notes: entry.notes,
    }) || null,
    image: null,
    createdAt: new Date(0).toISOString(),
  }));
}

export default async function VocabularyPage() {
  const session = await auth();

  let initialVocabulary: VocabularyItem[] = mapSeedToVocabularyItems();

  if (session?.user?.id) {
    await seedVocabularyForUser(session.user.id);

    const dbVocabulary = await prisma.vocab.findMany({
      orderBy: { createdAt: 'desc' },
    });

    initialVocabulary = dbVocabulary.map((item) => ({
      id: item.id,
      word: item.word,
      pronunciation: item.pronunciation,
      grammar: item.grammar,
      category: item.category,
      meaning: item.meaning,
      example: item.example,
      usageContext: item.usageContext,
      note: item.note,
      synonym: item.synonym,
      antonym: item.antonym,
      singularForm: item.singularForm,
      pluralForm: item.pluralForm,
      v2Form: item.v2Form,
      v3Form: item.v3Form,
      notes: item.notes,
      image: item.image,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  return (
    <div className="container py-8 md:py-12">
      <VocabularyHeader />
      <VocabularyManager initialVocabulary={initialVocabulary} />
    </div>
  );
}
