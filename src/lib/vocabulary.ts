function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const vietnameseAccentRegex =
  /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

const vietnameseHintRegex = /\b(la|su|viec|nguoi|nhung|cac|mot|de|duoc|trong|nghia|dong|trai|tu)\b/i;
const englishHintRegex = /\b(the|a|an|to|of|for|with|by|from|is|are|be|as|that|this)\b/i;

export function normalizeVocabularyWord(value: string): string {
  return value.trim().toLowerCase();
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