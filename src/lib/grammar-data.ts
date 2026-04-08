import { grammarSeedEntries } from '@/lib/grammar-seed';
import { slugifyGrammarTitle } from '@/lib/grammar';
import type { GrammarItem } from '@/components/grammar/types';
import { getGrammarEntryDelegate } from '@/lib/grammar-entry-delegate';

type SeedRow = {
  userId: string;
  title: string;
  slug: string;
  grammarType: string;
  level: string;
  explanation: string;
  usageGuide: string;
  structurePattern: string;
  exampleSentence: string;
  storyExample: string;
  practiceHint: string;
  tags: string[];
  isSeed: boolean;
  createdAt: Date;
};

function buildSeedRows(userId: string): SeedRow[] {
  const usedSlugs = new Set<string>();

  return grammarSeedEntries.map((entry, index) => {
    const baseSlug = slugifyGrammarTitle(entry.title);
    let slug = baseSlug;
    let cursor = 2;

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${cursor}`;
      cursor += 1;
    }

    usedSlugs.add(slug);

    return {
      userId,
      title: entry.title,
      slug,
      grammarType: entry.grammarType,
      level: entry.level,
      explanation: entry.explanation,
      usageGuide: entry.usageGuide,
      structurePattern: entry.structurePattern,
      exampleSentence: entry.exampleSentence,
      storyExample: entry.storyExample,
      practiceHint: entry.practiceHint,
      tags: entry.tags,
      isSeed: true,
      createdAt: new Date(Date.now() - index),
    };
  });
}

function mapDbItemToGrammarItem(item: {
  id: string;
  slug: string;
  title: string;
  grammarType: string | null;
  level: string | null;
  explanation: string;
  usageGuide: string | null;
  structurePattern: string | null;
  exampleSentence: string | null;
  storyExample: string | null;
  practiceHint: string | null;
  tags: string[];
  isSeed: boolean;
  createdAt: Date;
}): GrammarItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    grammarType: item.grammarType,
    level: item.level,
    explanation: item.explanation,
    usageGuide: item.usageGuide,
    structurePattern: item.structurePattern,
    exampleSentence: item.exampleSentence,
    storyExample: item.storyExample,
    practiceHint: item.practiceHint,
    tags: item.tags,
    isSeed: item.isSeed,
    createdAt: item.createdAt.toISOString(),
  };
}

function mapSeedItemToGrammarItem(index: number, item: (typeof grammarSeedEntries)[number]): GrammarItem {
  return {
    id: `seed-${index + 1}`,
    slug: slugifyGrammarTitle(item.title),
    title: item.title,
    grammarType: item.grammarType,
    level: item.level,
    explanation: item.explanation,
    usageGuide: item.usageGuide,
    structurePattern: item.structurePattern,
    exampleSentence: item.exampleSentence,
    storyExample: item.storyExample,
    practiceHint: item.practiceHint,
    tags: item.tags,
    isSeed: true,
    createdAt: new Date(0).toISOString(),
  };
}

export function mapSeedToGrammarItems(): GrammarItem[] {
  return grammarSeedEntries.map((entry, index) => mapSeedItemToGrammarItem(index, entry));
}

export async function seedGrammarForUser(userId: string): Promise<void> {
  const grammarEntry = getGrammarEntryDelegate();

  if (!grammarEntry) {
    return;
  }

  const seedRows = buildSeedRows(userId);
  const existingRows = await grammarEntry.findMany<{ slug: string; isSeed: boolean }>({
    where: { userId },
    select: {
      slug: true,
      isSeed: true,
    },
  });

  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
  const missingRows = seedRows.filter((row) => !existingBySlug.has(row.slug));

  if (missingRows.length > 0) {
    await grammarEntry.createMany({
      data: missingRows,
    });
  }

}

export async function getGrammarForUser(userId: string): Promise<GrammarItem[]> {
  const grammarEntry = getGrammarEntryDelegate();

  if (!grammarEntry) {
    return mapSeedToGrammarItems();
  }

  const rows = await grammarEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((item) => mapDbItemToGrammarItem(item));
}
