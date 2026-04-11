import type { VocabularyItem } from '@/components/vocabulary/VocabularyList';
import { VocabularyFormManager } from '@/components/vocabulary/VocabularyFormManager';
import { prisma } from '@/lib/prisma';

function mapDbToVocabularyItems(items: Array<{
  id: string;
  word: string;
  pronunciation: string | null;
  grammar: string | null;
  category: string | null;
  meaning: string | null;
  example: string | null;
  usageContext: string | null;
  note: string | null;
  synonym: string | null;
  antonym: string | null;
  singularForm: string | null;
  pluralForm: string | null;
  v2Form: string | null;
  v3Form: string | null;
  notes: string | null;
  image: string | null;
  createdAt: Date;
}>): VocabularyItem[] {
  return items.map((item) => ({
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

async function loadPublicVocabulary(): Promise<VocabularyItem[] | null> {
  try {
    const dbVocabulary = await prisma.vocab.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return mapDbToVocabularyItems(dbVocabulary);
  } catch (error) {
    console.error('[VocabularyManagePage] Failed to load public vocabulary from database, fallback to seed list.', error);
    return null;
  }
}

export default async function VocabularyManagePage() {
  let initialVocabulary: VocabularyItem[] = [];

  const loadedVocabulary = await loadPublicVocabulary();

  if (loadedVocabulary) {
    initialVocabulary = loadedVocabulary;
  }

  return (
    <div className="container py-8 md:py-12">
      <VocabularyFormManager initialVocabulary={initialVocabulary} />
    </div>
  );
}
