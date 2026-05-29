'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChipFilter } from '@/components/ui/ChipFilter';
import { normalizeVocabularyCategoryKey, normalizeVocabularyWord } from '@/lib/vocabulary';
import {
  type PronunciationAccent,
  type VocabularyItem,
  VocabularyList,
} from './VocabularyList';

type VocabularyManagerProps = {
  initialVocabulary: VocabularyItem[];
};

type SortMode = 'newest' | 'oldest' | 'a-z' | 'z-a';

const sortOptions: { label: string; value: SortMode }[] = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'A-Z', value: 'a-z' },
  { label: 'Z-A', value: 'z-a' },
];

const accentOptions: { label: string; value: PronunciationAccent }[] = [
  { label: 'Anh-Mỹ (US)', value: 'en-US' },
  { label: 'Anh-Anh (UK)', value: 'en-GB' },
];

const ITEMS_PER_PAGE = 9;

function compareTextDeterministic(a: string, b: string): number {
  const normalizedA = normalizeVocabularyCategoryKey(a);
  const normalizedB = normalizeVocabularyCategoryKey(b);

  if (normalizedA < normalizedB) {
    return -1;
  }

  if (normalizedA > normalizedB) {
    return 1;
  }

  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
}

function sortVocabularyItems(items: VocabularyItem[], sortMode: SortMode): VocabularyItem[] {
  return [...items].sort((a, b) => {
    if (sortMode === 'a-z') {
      return compareTextDeterministic(a.word, b.word);
    }

    if (sortMode === 'z-a') {
      return compareTextDeterministic(b.word, a.word);
    }

    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (sortMode === 'oldest') {
      return dateA - dateB;
    }

    return dateB - dateA;
  });
}

export function VocabularyManager({ initialVocabulary }: VocabularyManagerProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [pronunciationAccent, setPronunciationAccent] = useState<PronunciationAccent>('en-US');
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedVocabularyId, setHighlightedVocabularyId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(initialVocabulary.map((item) => item.category?.trim()).filter(Boolean))
    ) as string[];

    return ['Tất cả', ...uniqueCategories.sort(compareTextDeterministic)];
  }, [initialVocabulary]);

  const vocabularyByWord = useMemo(() => {
    const byWord = new Map<string, VocabularyItem>();

    for (const item of initialVocabulary) {
      const key = normalizeVocabularyWord(item.word);

      if (key && !byWord.has(key)) {
        byWord.set(key, item);
      }
    }

    return byWord;
  }, [initialVocabulary]);

  const filteredVocabulary = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = initialVocabulary.filter((item) => {
      const matchCategory =
        activeCategory === 'Tất cả' || (item.category || '').toLowerCase() === activeCategory.toLowerCase();

      if (!q) {
        return matchCategory;
      }

      const blob = [
        item.word,
        item.pronunciation,
        item.grammar,
        item.category,
        item.meaning,
        item.example,
        item.usageContext,
        item.synonym,
        item.antonym,
        item.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchCategory && blob.includes(q);
    });

    return sortVocabularyItems(filtered, sortMode);
  }, [activeCategory, initialVocabulary, search, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredVocabulary.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory, sortMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * ITEMS_PER_PAGE;
  const paginatedVocabulary = filteredVocabulary.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const openVocabularyItem = useCallback(
    (targetId: string) => {
      const sortedVocabulary = sortVocabularyItems(initialVocabulary, sortMode);
      const targetIndex = sortedVocabulary.findIndex((item) => item.id === targetId);

      if (targetIndex < 0) {
        return;
      }

      setSearch('');
      setActiveCategory('Tất cả');
      setCurrentPage(Math.floor(targetIndex / ITEMS_PER_PAGE) + 1);
      setHighlightedVocabularyId(null);

      window.setTimeout(() => {
        setHighlightedVocabularyId(targetId);
      }, 0);
    },
    [initialVocabulary, sortMode]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-text-muted">
          Danh sách hiện tại có {initialVocabulary.length} từ. Bấm Thêm từ để mở trang quản lý form riêng.
        </p>
        <Button asChild>
          <Link href="/vocabulary/manage">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm từ
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-secondary/20 p-4">
          <p className="text-sm text-text-muted">Cài đặt phát âm mặc định cho nút loa trên từng thẻ từ vựng.</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-medium text-text-muted">Kiểu tiếng Anh:</span>
            {accentOptions.map((option) => (
              <ChipFilter
                key={option.value}
                label={option.label}
                isActive={pronunciationAccent === option.value}
                onClick={() => setPronunciationAccent(option.value)}
              />
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo từ, phiên âm, nghĩa, chủ đề..."
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-medium text-text-muted">Chủ đề:</span>
          {categories.map((category) => (
            <ChipFilter
              key={category}
              label={category}
              isActive={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-medium text-text-muted">Sắp xếp:</span>
          {sortOptions.map((option) => (
            <ChipFilter
              key={option.value}
              label={option.label}
              isActive={sortMode === option.value}
              onClick={() => setSortMode(option.value)}
            />
          ))}
        </div>
      </div>

      <VocabularyList
        vocabulary={paginatedVocabulary}
        manageBasePath="/vocabulary/manage"
        pronunciationSettings={{ accent: pronunciationAccent }}
        vocabularyByWord={vocabularyByWord}
        onOpenVocabularyItem={openVocabularyItem}
        highlightedVocabularyId={highlightedVocabularyId}
      />

      {filteredVocabulary.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-text-muted">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredVocabulary.length)} trên{' '}
            {filteredVocabulary.length} từ
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPageSafe === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Trước
            </Button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <Button
                key={page}
                type="button"
                size="sm"
                variant={page === currentPageSafe ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
                className="min-w-9"
              >
                {page}
              </Button>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPageSafe === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
