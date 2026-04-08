function toAsciiBase(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function normalizeGrammarTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function slugifyGrammarTitle(value: string): string {
  const normalized = toAsciiBase(normalizeGrammarTitle(value));

  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return slug || 'grammar-point';
}

export function uniqueTags(values?: string[] | null): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawValue of values) {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      continue;
    }

    const key = toAsciiBase(trimmed);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);

    if (result.length >= 12) {
      break;
    }
  }

  return result;
}
