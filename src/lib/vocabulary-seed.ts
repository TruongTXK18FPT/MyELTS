export type VocabularySeedEntry = {
  word: string;
  pronunciation?: string;
  grammar?: string;
  category?: string;
  meaning?: string;
  example?: string;
  usageContext?: string;
  note?: string;
  synonym?: string;
  antonym?: string;
  singularForm?: string;
  pluralForm?: string;
  v2Form?: string;
  v3Form?: string;
  notes?: string;
};

export const vocabularySeedEntries: VocabularySeedEntry[] = [
  {
    word: 'Conundrum',
    pronunciation: '/kəˈnʌndrəm/',
    grammar: 'noun',
    category: 'Work',
    meaning: 'Câu đố, vấn đề khó',
    example: 'The team faced a conundrum when the project funding was cut.',
  },
  {
    word: 'Ephemeral',
    pronunciation: '/ɪˈfɛmərəl/',
    grammar: 'adjective',
    category: 'Nature',
    meaning: 'Phù du, chóng tàn',
    example: 'The beauty of the cherry blossoms is ephemeral.',
  },
  {
    word: 'Alleviate',
    pronunciation: '/əˈliːvieɪt/',
    grammar: 'verb',
    category: 'Health',
    meaning: 'Làm giảm bớt',
    example: 'The medicine helped to alleviate her pain.',
  },
  {
    word: 'Ubiquitous',
    pronunciation: '/juːˈbɪkwɪtəs/',
    grammar: 'adjective',
    category: 'Technology',
    meaning: 'Phổ biến, ở đâu cũng có',
    example: 'Smartphones have become ubiquitous in modern society.',
  },
  {
    word: 'Pedagogy',
    pronunciation: '/ˈpɛdəɡɒdʒi/',
    grammar: 'noun',
    category: 'Education',
    meaning: 'Khoa sư phạm',
    example: 'The new teacher is studying modern pedagogy.',
  },
  {
    word: 'Sustainable',
    pronunciation: '/səˈsteɪnəbl/',
    grammar: 'adjective',
    category: 'Environment',
    meaning: 'Bền vững',
    example: 'We need to find sustainable sources of energy.',
  },
];

export function buildVocabularyNotes(input: {
  meaning?: string | null;
  example?: string | null;
  usageContext?: string | null;
  note?: string | null;
  synonym?: string | null;
  antonym?: string | null;
  singularForm?: string | null;
  pluralForm?: string | null;
  v2Form?: string | null;
  v3Form?: string | null;
  notes?: string | null;
}): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (line: string) => {
    const normalized = line
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    parts.push(line.trim());
  };

  if (input.meaning?.trim()) {
    pushUnique(`Nghĩa: ${input.meaning.trim()}`);
  }

  if (input.example?.trim()) {
    pushUnique(`Ví dụ: ${input.example.trim()}`);
  }

  if (input.usageContext?.trim()) {
    pushUnique(`Ngữ cảnh: ${input.usageContext.trim()}`);
  }

  if (input.note?.trim()) {
    pushUnique(`Ghi chú: ${input.note.trim()}`);
  }

  if (input.synonym?.trim()) {
    pushUnique(`Đồng nghĩa: ${input.synonym.trim()}`);
  }

  if (input.antonym?.trim()) {
    pushUnique(`Trái nghĩa: ${input.antonym.trim()}`);
  }

  if (input.singularForm?.trim()) {
    pushUnique(`Số ít: ${input.singularForm.trim()}`);
  }

  if (input.pluralForm?.trim()) {
    pushUnique(`Số nhiều: ${input.pluralForm.trim()}`);
  }

  if (input.v2Form?.trim()) {
    pushUnique(`V2: ${input.v2Form.trim()}`);
  }

  if (input.v3Form?.trim()) {
    pushUnique(`V3: ${input.v3Form.trim()}`);
  }

  if (input.notes?.trim()) {
    input.notes
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => pushUnique(line));
  }

  return parts.join('\n');
}
