import { normalizeVocabularyCategoryKey } from './vocabulary';

export type VocabularyFamilyMember = {
  word: string;
  grammar?: string;
  relation?: string;
  meaning?: string;
  example?: string;
  usageContext?: string;
  note?: string;
};

export type VocabularyFamilyMeta = {
  familyKey: string;
  members: VocabularyFamilyMember[];
};

const WORD_FAMILY_META_START = '[[WORD_FAMILY_META]]';
const WORD_FAMILY_META_END = '[[/WORD_FAMILY_META]]';

function sanitizeText(value: string | undefined, maxLength: number): string {
  return (value || '').trim().slice(0, maxLength);
}

export function deriveVocabularyFamilyKey(word: string): string {
  const normalized = normalizeVocabularyCategoryKey(word)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'general-family';
}

function sanitizeVocabularyFamilyMember(input: VocabularyFamilyMember): VocabularyFamilyMember | null {
  const word = sanitizeText(input.word, 120);

  if (!word) {
    return null;
  }

  return {
    word,
    grammar: sanitizeText(input.grammar, 120),
    relation: sanitizeText(input.relation, 120),
    meaning: sanitizeText(input.meaning, 1200),
    example: sanitizeText(input.example, 1400),
    usageContext: sanitizeText(input.usageContext, 1400),
    note: sanitizeText(input.note, 1800),
  };
}

export function sanitizeVocabularyFamilyMembers(members: VocabularyFamilyMember[]): VocabularyFamilyMember[] {
  const deduped = new Map<string, VocabularyFamilyMember>();

  for (const member of members) {
    const sanitized = sanitizeVocabularyFamilyMember(member);

    if (!sanitized) {
      continue;
    }

    const key = normalizeVocabularyCategoryKey(sanitized.word);

    if (!deduped.has(key)) {
      deduped.set(key, sanitized);
      continue;
    }

    const existing = deduped.get(key)!;

    deduped.set(key, {
      ...existing,
      grammar: existing.grammar || sanitized.grammar,
      relation: existing.relation || sanitized.relation,
      meaning: existing.meaning || sanitized.meaning,
      example: existing.example || sanitized.example,
      usageContext: existing.usageContext || sanitized.usageContext,
      note: existing.note || sanitized.note,
    });
  }

  return [...deduped.values()];
}

export function extractVocabularyFamilyMeta(notes?: string | null): {
  plainNotes: string | null;
  meta: VocabularyFamilyMeta | null;
} {
  if (!notes) {
    return { plainNotes: null, meta: null };
  }

  const startIndex = notes.indexOf(WORD_FAMILY_META_START);

  if (startIndex < 0) {
    return { plainNotes: notes, meta: null };
  }

  const endIndex = notes.indexOf(WORD_FAMILY_META_END, startIndex + WORD_FAMILY_META_START.length);

  if (endIndex < 0) {
    return { plainNotes: notes, meta: null };
  }

  const jsonPayload = notes
    .slice(startIndex + WORD_FAMILY_META_START.length, endIndex)
    .trim();

  const plainBefore = notes.slice(0, startIndex).trim();
  const plainAfter = notes.slice(endIndex + WORD_FAMILY_META_END.length).trim();
  const plainNotes = [plainBefore, plainAfter].filter(Boolean).join('\n').trim() || null;

  try {
    const parsed = JSON.parse(jsonPayload) as Partial<VocabularyFamilyMeta>;
    const familyKey = sanitizeText(parsed.familyKey, 200);
    const members = sanitizeVocabularyFamilyMembers(Array.isArray(parsed.members) ? parsed.members : []);

    if (!familyKey || members.length === 0) {
      return { plainNotes, meta: null };
    }

    return {
      plainNotes,
      meta: {
        familyKey,
        members,
      },
    };
  } catch {
    return { plainNotes, meta: null };
  }
}

export function upsertVocabularyFamilyMeta(
  notes: string | null | undefined,
  meta: VocabularyFamilyMeta | null
): string | null {
  const extracted = extractVocabularyFamilyMeta(notes);

  if (!meta) {
    return extracted.plainNotes;
  }

  const familyKey = sanitizeText(meta.familyKey, 200) || deriveVocabularyFamilyKey('general');
  const members = sanitizeVocabularyFamilyMembers(meta.members);

  if (members.length === 0) {
    return extracted.plainNotes;
  }

  const serialized = JSON.stringify({
    familyKey,
    members,
  });

  const block = `${WORD_FAMILY_META_START}\n${serialized}\n${WORD_FAMILY_META_END}`;

  if (!extracted.plainNotes) {
    return block;
  }

  return `${extracted.plainNotes}\n${block}`;
}
