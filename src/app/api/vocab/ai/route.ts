import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  capitalizeVocabularyWord,
  findExistingVocabularyCategory,
  findRelatedVocabularyCategory,
  isVietnameseMeaning,
  normalizeVocabularyCategory,
  normalizeVocabularyWord,
  resolveVocabularyCategory,
} from '@/lib/vocabulary';
import { deriveVocabularyFamilyKey } from '@/lib/vocabulary-family';

const mistralEndpoint = 'https://api.mistral.ai/v1/chat/completions';

const quickGrammarFilterValues = ['noun', 'verb', 'adjective', 'adverb', 'phrasal verb', 'collocation', 'idiom'] as const;
type QuickGrammarFilter = (typeof quickGrammarFilterValues)[number];

const enrichFromTermRequestSchema = z.object({
  action: z.literal('enrich-from-term'),
  term: z.string().trim().min(1, 'Vui lòng nhập từ khóa.').max(160),
});

const enrichFromVietnameseRequestSchema = z.object({
  action: z.literal('enrich-from-vietnamese'),
  vietnameseVocabulary: z.string().trim().min(1, 'Vui lòng nhập từ tiếng Việt.').max(160),
});

const generateRequestSchema = z.object({
  action: z.literal('generate-from-topic'),
  topic: z.string().trim().min(2, 'Vui lòng nhập chủ đề.').max(180),
  count: z.coerce.number().int().min(5).max(20).default(8),
  grammarFilters: z.array(z.enum(quickGrammarFilterValues)).max(quickGrammarFilterValues.length).optional().default([]),
});

const requestSchema = z.discriminatedUnion('action', [
  enrichFromTermRequestSchema,
  enrichFromVietnameseRequestSchema,
  generateRequestSchema,
]);

const aiVocabItemSchema = z.object({
  word: z.string().trim().min(1).max(120),
  pronunciation: z.string().trim().max(160).optional().default(''),
  grammar: z.string().trim().max(120).optional().default(''),
  category: z.string().trim().max(120).optional().default(''),
  meaning: z.string().trim().max(1200).optional().default(''),
  example: z.string().trim().max(1400).optional().default(''),
  usageContext: z.string().trim().max(1400).optional().default(''),
  note: z.string().trim().max(1800).optional().default(''),
  synonym: z.string().trim().max(600).optional().default(''),
  antonym: z.string().trim().max(600).optional().default(''),
  singularForm: z.string().trim().max(120).optional().default(''),
  pluralForm: z.string().trim().max(120).optional().default(''),
  v2Form: z.string().trim().max(120).optional().default(''),
  v3Form: z.string().trim().max(120).optional().default(''),
});

const aiWordFamilyItemSchema = aiVocabItemSchema.extend({
  relation: z.string().trim().max(120).optional().default(''),
});

const enrichResponseSchema = z.object({
  item: aiVocabItemSchema,
  wordFamily: z.array(aiWordFamilyItemSchema).max(20).optional().default([]),
});

const generateResponseSchema = z.object({
  items: z.array(aiVocabItemSchema).min(1).max(60),
});

type AIVocabItem = z.infer<typeof aiVocabItemSchema>;
type AIWordFamilyItem = z.infer<typeof aiWordFamilyItemSchema>;

type MistralChoice = {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
};

type MistralResponse = {
  choices?: MistralChoice[];
};

const detailedWordThreshold = {
  example: 8,
  usageContext: 12,
  note: 8,
};

const vietnameseAccentRegex =
  /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

const romanizedVietnameseHintRegex =
  /\b(la|su|viec|nguoi|nhung|cac|mot|de|duoc|trong|nghia|dong|trai|tu|cam|hoi)\b/i;

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasDetailedText(value: string, minWords: number): boolean {
  return countWords(value) >= minWords;
}

function normalizeGrammarValue(value: string): string {
  return value.trim().toLowerCase();
}

function matchesGrammarFilters(grammar: string, filters: QuickGrammarFilter[]): boolean {
  if (filters.length === 0) {
    return true;
  }

  const normalizedGrammar = normalizeGrammarValue(grammar);
  return filters.some((filter) => normalizedGrammar.includes(filter));
}

function detectInputLanguage(term: string): 'vi' | 'en' {
  const trimmed = term.trim();

  if (!trimmed) {
    return 'vi';
  }

  if (vietnameseAccentRegex.test(trimmed)) {
    return 'vi';
  }

  if (romanizedVietnameseHintRegex.test(trimmed.toLowerCase())) {
    return 'vi';
  }

  return 'en';
}

function ensureDetailedItem(item: AIVocabItem, topic: string): AIVocabItem {
  const cleanedTopic = topic.trim() || 'IELTS topics';
  const safeWord = item.word.trim() || 'Term';

  const fallbackExample =
    `In a recent IELTS discussion about ${cleanedTopic}, the lecturer used ${safeWord} to explain the main idea clearly and naturally.`;
  const fallbackUsage =
    `Use ${safeWord} in formal speaking and writing when discussing ${cleanedTopic}. It is most effective when paired with precise evidence, clear collocations, and a specific context.`;
  const fallbackNote =
    `Common mistake: learners often use ${safeWord} without enough context. Add a clear subject, a suitable collocation, and one supporting detail to make your sentence natural.`;

  return {
    ...item,
    example: hasDetailedText(item.example, detailedWordThreshold.example) ? item.example : fallbackExample,
    usageContext: hasDetailedText(item.usageContext, detailedWordThreshold.usageContext)
      ? item.usageContext
      : fallbackUsage,
    note: hasDetailedText(item.note, detailedWordThreshold.note) ? item.note : fallbackNote,
  };
}

function extractMessageContent(payload: MistralResponse): string {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }

  return '';
}

function extractJsonText(rawContent: string): string {
  const trimmed = rawContent.trim();

  const withoutCodeFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const startIndex = withoutCodeFence.indexOf('{');
  const endIndex = withoutCodeFence.lastIndexOf('}');

  if (startIndex >= 0 && endIndex > startIndex) {
    return withoutCodeFence.slice(startIndex, endIndex + 1);
  }

  return withoutCodeFence;
}

function sanitizeVocabItem(item: AIVocabItem): AIVocabItem {
  return {
    word: capitalizeVocabularyWord(item.word),
    pronunciation: item.pronunciation.trim(),
    grammar: item.grammar.trim(),
    category: item.category.trim(),
    meaning: item.meaning.trim(),
    example: item.example.trim(),
    usageContext: item.usageContext.trim(),
    note: item.note.trim(),
    synonym: item.synonym.trim(),
    antonym: item.antonym.trim(),
    singularForm: item.singularForm.trim(),
    pluralForm: item.pluralForm.trim(),
    v2Form: item.v2Form.trim(),
    v3Form: item.v3Form.trim(),
  };
}

function sanitizeWordFamilyItem(item: AIWordFamilyItem): AIWordFamilyItem {
  return {
    ...sanitizeVocabItem(item),
    relation: item.relation.trim(),
  };
}

function isValidMeaning(item: AIVocabItem): boolean {
  return isVietnameseMeaning(item.meaning);
}

async function callMistralForJson(userPrompt: string): Promise<unknown> {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error('Thiếu MISTRAL_API_KEY trong biến môi trường.');
  }

  const response = await fetch(mistralEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an IELTS vocabulary assistant. Always return valid JSON only. Keep vocabulary practical and learner-friendly.',
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as MistralResponse | null;

  if (!response.ok || !payload) {
    console.error('Mistral API failed:', payload);
    throw new Error('Yêu cầu tới Mistral API thất bại.');
  }

  const rawContent = extractMessageContent(payload);
  const jsonText = extractJsonText(rawContent);

  if (!jsonText) {
    throw new Error('AI trả về dữ liệu rỗng.');
  }

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error('Không thể phân tích JSON do AI trả về.');
  }
}

type UserVocabularySnapshot = {
  existingWordSet: Set<string>;
  existingTopics: string[];
};

async function getUserVocabularySnapshot(): Promise<UserVocabularySnapshot> {
  const rows = await prisma.vocab.findMany({
    select: {
      word: true,
      category: true,
    },
  });

  const existingWordSet = new Set(rows.map((entry) => normalizeVocabularyWord(entry.word)));

  const existingTopics = Array.from(
    new Set(rows.map((entry) => normalizeVocabularyCategory(entry.category)).filter(Boolean))
  );

  return {
    existingWordSet,
    existingTopics,
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const payload = requestSchema.parse(await req.json());
  const snapshot = await getUserVocabularySnapshot();
    const existingTopics = snapshot.existingTopics;

    if (payload.action === 'enrich-from-term' || payload.action === 'enrich-from-vietnamese') {
      const inputTerm = payload.action === 'enrich-from-term' ? payload.term : payload.vietnameseVocabulary;
      const detectedLanguage = payload.action === 'enrich-from-vietnamese' ? 'vi' : detectInputLanguage(inputTerm);
      const sourceLine =
        detectedLanguage === 'vi'
          ? `Given the Vietnamese term or phrase: "${inputTerm}".`
          : `Given the English term or phrase: "${inputTerm}".`;
      const existingTopicsLine =
        existingTopics.length > 0
          ? `Existing topics in the database: ${existingTopics.join(', ')}.`
          : 'There are no existing topics in the database yet.';

      const aiJson = await callMistralForJson(`
${sourceLine}
${existingTopicsLine}

Return JSON with this exact shape:
{
  "item": {
    "word": "English vocabulary term with first letter uppercase",
    "pronunciation": "IPA",
    "grammar": "part of speech",
    "category": "topic",
    "meaning": "Vietnamese meaning only",
    "example": "Natural English sentence example with at least 8 words",
    "usageContext": "Detailed usage guidance with at least 12 words",
    "note": "Helpful IELTS note with at least 8 words",
    "synonym": "Synonym term(s)",
    "antonym": "Antonym term(s)",
    "singularForm": "Singular form if noun, otherwise empty",
    "pluralForm": "Plural form if noun, otherwise empty",
    "v2Form": "Past tense form if verb, otherwise empty",
    "v3Form": "Past participle form if verb, otherwise empty"
  },
  "wordFamily": [
    {
      "word": "related word form",
      "pronunciation": "IPA",
      "grammar": "part of speech",
      "relation": "verb|noun|adjective|adverb|agent noun|other",
      "category": "topic",
      "meaning": "Vietnamese meaning only",
      "example": "Natural English sentence example with at least 8 words",
      "usageContext": "Detailed usage guidance with at least 12 words",
      "note": "Helpful IELTS note with at least 8 words",
      "synonym": "Synonym term(s)",
      "antonym": "Antonym term(s)",
      "singularForm": "Singular form if noun, otherwise empty",
      "pluralForm": "Plural form if noun, otherwise empty",
      "v2Form": "Past tense form if verb, otherwise empty",
      "v3Form": "Past participle form if verb, otherwise empty"
    }
  ]
}

Rules:
- "word" must be in English.
- Capitalize the first letter of "word".
- "meaning" must be Vietnamese, not English.
- Prefer an existing topic in "category" when it is semantically related.
- Create a new "category" only when no existing topic matches the term.
- Build a complete IELTS-ready word family when possible: noun, verb, adjective, adverb, and agent noun forms.
- Every word family item must contain meaningful "relation" and practical learner guidance.
- Keep "example", "usageContext", and "note" practical and specific for IELTS learners.
- Do not include markdown.
- Always return valid JSON only.
      `);

      const parsed = enrichResponseSchema.parse(aiJson);
      const enrichedItem = ensureDetailedItem(sanitizeVocabItem(parsed.item), 'general IELTS topics');

      const relatedExistingTopic =
        findExistingVocabularyCategory(enrichedItem.category, existingTopics) ||
        findRelatedVocabularyCategory(`${inputTerm} ${enrichedItem.meaning} ${enrichedItem.category}`, existingTopics);

      const resolvedCategory =
        resolveVocabularyCategory(relatedExistingTopic || enrichedItem.category, existingTopics) || '';

      const item: AIVocabItem = {
        ...enrichedItem,
        category: resolvedCategory,
      };

      const familyWordSet = new Set<string>([normalizeVocabularyWord(item.word)]);
      const wordFamily = parsed.wordFamily
        .map((candidate) => {
          const sanitized = sanitizeWordFamilyItem(candidate);
          const detailed = ensureDetailedItem(sanitized, resolvedCategory || 'general IELTS topics');

          return {
            ...detailed,
            relation: sanitized.relation,
          };
        })
        .filter((candidate) => {
          const key = normalizeVocabularyWord(candidate.word);

          if (!key || familyWordSet.has(key)) {
            return false;
          }

          if (!isValidMeaning(candidate)) {
            return false;
          }

          familyWordSet.add(key);
          return true;
        })
        .slice(0, 12)
        .map((candidate) => ({
          ...candidate,
          category: resolvedCategory,
          relation: candidate.relation || candidate.grammar || 'related form',
        }));

      if (!isValidMeaning(item)) {
        throw new Error('AI trả về nghĩa chưa đúng tiếng Việt, vui lòng thử lại.');
      }

      const familyKey = deriveVocabularyFamilyKey(item.word || inputTerm);

      return NextResponse.json({
        item,
        wordFamily,
        familyKey,
      });
    }

    const requestedCount = payload.count;
    const grammarFilters = Array.from(new Set(payload.grammarFilters));
    const grammarHint =
      grammarFilters.length > 0
        ? `Target part(s) of speech: ${grammarFilters.join(', ')}.`
        : 'You may mix noun, verb, adjective, adverb, phrasal verb, collocation, and idiom.';

    const requestedTopic = normalizeVocabularyCategory(payload.topic);
    const relatedExistingTopic =
      findExistingVocabularyCategory(requestedTopic, existingTopics) ||
      findRelatedVocabularyCategory(requestedTopic, existingTopics);
    const resolvedTopic =
      resolveVocabularyCategory(relatedExistingTopic || requestedTopic, existingTopics) || requestedTopic;

    const existingWordSet = snapshot.existingWordSet;
    const blockedWords = Array.from(existingWordSet).slice(0, 220);

    const aiJson = await callMistralForJson(`
Generate ${requestedCount + 8} unique English vocabulary items for IELTS learners about topic: "${resolvedTopic}".

${grammarHint}

Existing words to avoid:
${blockedWords.join(', ') || '(none)'}

Return JSON with this exact shape:
{
  "items": [
    {
      "word": "...",
      "pronunciation": "...",
      "grammar": "...",
      "category": "...",
      "meaning": "...",
      "example": "...",
      "usageContext": "...",
      "note": "...",
      "synonym": "...",
      "antonym": "...",
      "singularForm": "...",
      "pluralForm": "...",
      "v2Form": "...",
      "v3Form": "..."
    }
  ]
}

Rules:
- Output 100% valid JSON only.
- Every "word" must be unique and relevant to the topic.
- Capitalize the first letter of each "word".
- "meaning" must be written in Vietnamese.
- "example" must have at least 8 words and be natural.
- "usageContext" must have at least 12 words with collocation/register guidance.
- "note" must have at least 8 words and include a common-usage tip.
- Do not repeat items from the existing words list.
- Set "category" exactly to "${resolvedTopic}" for every item.
- Use practical IELTS-level vocabulary.
    `);

    const parsed = generateResponseSchema.parse(aiJson);

    const usedWordSet = new Set(existingWordSet);
    const deduped: AIVocabItem[] = [];

    let filteredByGrammar = 0;
    let filteredByQuality = 0;

    for (const rawItem of parsed.items) {
      const item = ensureDetailedItem(
        {
          ...sanitizeVocabItem(rawItem),
          category: resolvedTopic,
        },
        resolvedTopic
      );
      const key = normalizeVocabularyWord(item.word);

      if (!key || usedWordSet.has(key) || !isValidMeaning(item)) {
        filteredByQuality += 1;
        continue;
      }

      if (grammarFilters.length > 0 && !matchesGrammarFilters(item.grammar, grammarFilters)) {
        filteredByGrammar += 1;
        continue;
      }

      if (
        !hasDetailedText(item.example, detailedWordThreshold.example) ||
        !hasDetailedText(item.usageContext, detailedWordThreshold.usageContext) ||
        !hasDetailedText(item.note, detailedWordThreshold.note)
      ) {
        filteredByQuality += 1;
        continue;
      }

      usedWordSet.add(key);
      deduped.push(item);

      if (deduped.length >= requestedCount) {
        break;
      }
    }

    const warningParts: string[] = [];

    if (deduped.length < requestedCount) {
      warningParts.push(`AI chỉ trả về ${deduped.length} từ mới duy nhất sau khi lọc.`);
    }

    if (filteredByGrammar > 0) {
      warningParts.push(`Đã bỏ ${filteredByGrammar} từ không khớp loại từ bạn chọn.`);
    }

    if (filteredByQuality > 0) {
      warningParts.push(`Đã bỏ ${filteredByQuality} từ do trùng hoặc chưa đạt yêu cầu chất lượng.`);
    }

    if (resolvedTopic.toLowerCase() !== requestedTopic.toLowerCase()) {
      warningParts.push(`Đã đồng bộ chủ đề về "${resolvedTopic}" theo chủ đề đã có trong hệ thống.`);
    }

    return NextResponse.json({
      items: deduped,
      topic: resolvedTopic,
      warning: warningParts.length > 0 ? warningParts.join(' ') : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể tạo danh sách từ vựng bằng AI.' }, { status: 500 });
  }
}
