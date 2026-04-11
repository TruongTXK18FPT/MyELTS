function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

const vietnameseAccentRegex =
  /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

const vietnameseHintRegex = /\b(la|su|viec|nguoi|nhung|cac|mot|de|duoc|trong|nghia|dong|trai|tu)\b/i;
const englishHintRegex = /\b(the|a|an|to|of|for|with|by|from|is|are|be|as|that|this)\b/i;

export function normalizeVocabularyWord(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeVocabularyCategory(value?: string | null): string {
  return collapseWhitespace(value || '');
}

export function normalizeVocabularyCategoryKey(value?: string | null): string {
  return stripDiacritics(normalizeVocabularyCategory(value).toLowerCase().replace(/đ/g, 'd'));
}

export function findExistingVocabularyCategory(value: string, existingCategories: string[]): string | null {
  const targetKey = normalizeVocabularyCategoryKey(value);

  if (!targetKey) {
    return null;
  }

  for (const category of existingCategories) {
    if (normalizeVocabularyCategoryKey(category) === targetKey) {
      return normalizeVocabularyCategory(category);
    }
  }

  return null;
}

export function resolveVocabularyCategory(value: string | null | undefined, existingCategories: string[]): string | null {
  const normalized = normalizeVocabularyCategory(value);

  if (!normalized) {
    return null;
  }

  return findExistingVocabularyCategory(normalized, existingCategories) || normalized;
}

export function findRelatedVocabularyCategory(value: string, existingCategories: string[]): string | null {
  const normalizedInput = normalizeVocabularyCategoryKey(value);

  if (!normalizedInput) {
    return null;
  }

  const directMatch = findExistingVocabularyCategory(value, existingCategories);

  if (directMatch) {
    return directMatch;
  }

  const inputTokens = normalizedInput
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  let bestCandidate: string | null = null;
  let bestScore = 0;

  for (const category of existingCategories) {
    const categoryKey = normalizeVocabularyCategoryKey(category);

    if (!categoryKey) {
      continue;
    }

    let score = 0;

    if (categoryKey.includes(normalizedInput) || normalizedInput.includes(categoryKey)) {
      score += 4;
    }

    if (inputTokens.length > 0) {
      const categoryTokens = new Set(
        categoryKey
          .split(/[^a-z0-9]+/)
          .map((token) => token.trim())
          .filter((token) => token.length >= 3)
      );

      for (const token of inputTokens) {
        if (categoryTokens.has(token)) {
          score += 2;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = normalizeVocabularyCategory(category);
    }
  }

  return bestScore >= 2 ? bestCandidate : null;
}

export function getVocabularyCategoryStats(items: Array<{ category?: string | null }>): Array<{ category: string; count: number }> {
  const byKey = new Map<string, { category: string; count: number }>();

  for (const item of items) {
    const normalizedCategory = normalizeVocabularyCategory(item.category);

    if (!normalizedCategory) {
      continue;
    }

    const key = normalizeVocabularyCategoryKey(normalizedCategory);
    const existing = byKey.get(key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    byKey.set(key, {
      category: normalizedCategory,
      count: 1,
    });
  }

  return [...byKey.values()].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    const keyA = normalizeVocabularyCategoryKey(a.category);
    const keyB = normalizeVocabularyCategoryKey(b.category);

    if (keyA < keyB) {
      return -1;
    }

    if (keyA > keyB) {
      return 1;
    }

    if (a.category < b.category) {
      return -1;
    }

    if (a.category > b.category) {
      return 1;
    }

    return 0;
  });
}

export function capitalizeVocabularyWord(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

export function isVietnameseMeaning(value?: string | null): boolean {
  const trimmed = value?.trim();

  if (!trimmed) {
    return true;
  }

  if (vietnameseAccentRegex.test(trimmed)) {
    return true;
  }

  const normalized = stripDiacritics(trimmed.toLowerCase());

  if (vietnameseHintRegex.test(normalized)) {
    return true;
  }

  if (englishHintRegex.test(normalized)) {
    return false;
  }

  // Accept short meanings that do not include clear English stop words.
  return normalized.split(/\s+/).filter(Boolean).length <= 2;
}