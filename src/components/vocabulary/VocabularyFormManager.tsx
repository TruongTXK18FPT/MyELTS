'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogIn,
  PlusCircle,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  WandSparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChipFilter } from '@/components/ui/ChipFilter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  deriveVocabularyFamilyKey,
  extractVocabularyFamilyMeta,
  type VocabularyFamilyMember,
  upsertVocabularyFamilyMeta,
} from '@/lib/vocabulary-family';
import { buildVocabularyNotes } from '@/lib/vocabulary-seed';
import {
  capitalizeVocabularyWord,
  findExistingVocabularyCategory,
  getVocabularyCategoryStats,
  normalizeVocabularyCategory,
  normalizeVocabularyCategoryKey,
  normalizeVocabularyWord,
  resolveVocabularyCategory,
} from '@/lib/vocabulary';
import { VocabularyItem } from './VocabularyList';

type VocabularyFormManagerProps = {
  initialVocabulary: VocabularyItem[];
};

type VocabularyFormState = {
  word: string;
  pronunciation: string;
  grammar: string;
  category: string;
  meaning: string;
  example: string;
  usageContext: string;
  note: string;
  synonym: string;
  antonym: string;
  singularForm: string;
  pluralForm: string;
  v2Form: string;
  v3Form: string;
  imageUrl: string | null;
};

type AIVocabularyDraft = Omit<VocabularyFormState, 'imageUrl'>;
type AIWordFamilyDraft = AIVocabularyDraft & { relation: string };

type StatusState = {
  type: 'success' | 'error';
  message: string;
};

type AIMode = 'enrich' | 'generate-topic' | 'save-generated' | null;
type QuickGrammarFilter = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrasal verb' | 'collocation' | 'idiom';
type TopicMode = 'existing' | 'new';

const initialFormState: VocabularyFormState = {
  word: '',
  pronunciation: '',
  grammar: '',
  category: '',
  meaning: '',
  example: '',
  usageContext: '',
  note: '',
  synonym: '',
  antonym: '',
  singularForm: '',
  pluralForm: '',
  v2Form: '',
  v3Form: '',
  imageUrl: null,
};

const topicCountOptions = Array.from({ length: 16 }, (_, index) => index + 5);

const quickGrammarOptions: { label: string; value: QuickGrammarFilter }[] = [
  { label: 'Danh từ (Noun)', value: 'noun' },
  { label: 'Động từ (Verb)', value: 'verb' },
  { label: 'Tính từ (Adjective)', value: 'adjective' },
  { label: 'Trạng từ (Adverb)', value: 'adverb' },
  { label: 'Cụm động từ (Phrasal verb)', value: 'phrasal verb' },
  { label: 'Collocation', value: 'collocation' },
  { label: 'Idiom', value: 'idiom' },
];

function hasEnoughWords(text: string, minWords: number): boolean {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length >= minWords;
}

function hasDetailedQuickDraft(draft: AIVocabularyDraft): boolean {
  return (
    hasEnoughWords(draft.example, 8) &&
    hasEnoughWords(draft.usageContext, 12) &&
    hasEnoughWords(draft.note, 8)
  );
}

function normalizeLabel(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLegacyNotes(notes?: string | null): Partial<VocabularyFormState> {
  if (!notes) {
    return {};
  }

  const lines = notes
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: Partial<VocabularyFormState> = {};

  for (const line of lines) {
    const splitIndex = line.indexOf(':');

    if (splitIndex < 0) {
      continue;
    }

    const label = normalizeLabel(line.slice(0, splitIndex));
    const value = line.slice(splitIndex + 1).trim();

    if (!value) {
      continue;
    }

    if (!parsed.meaning && label.startsWith('nghia')) {
      parsed.meaning = value;
      continue;
    }

    if (!parsed.example && label.startsWith('vi du')) {
      parsed.example = value;
      continue;
    }

    if (!parsed.usageContext && (label.startsWith('ngu canh') || label.startsWith('cach dung'))) {
      parsed.usageContext = value;
      continue;
    }

    if (!parsed.note && label.startsWith('ghi chu')) {
      parsed.note = value;
      continue;
    }

    if (!parsed.synonym && label.startsWith('dong nghia')) {
      parsed.synonym = value;
      continue;
    }

    if (!parsed.antonym && label.startsWith('trai nghia')) {
      parsed.antonym = value;
      continue;
    }

    if (!parsed.singularForm && label.startsWith('so it')) {
      parsed.singularForm = value;
      continue;
    }

    if (!parsed.pluralForm && label.startsWith('so nhieu')) {
      parsed.pluralForm = value;
      continue;
    }

    if (!parsed.v2Form && label === 'v2') {
      parsed.v2Form = value;
      continue;
    }

    if (!parsed.v3Form && label === 'v3') {
      parsed.v3Form = value;
      continue;
    }
  }

  return parsed;
}

function toFormState(item?: VocabularyItem): VocabularyFormState {
  if (!item) {
    return initialFormState;
  }

  const legacy = parseLegacyNotes(item.notes);

  return {
    word: item.word || '',
    pronunciation: item.pronunciation || '',
    grammar: item.grammar || '',
    category: item.category || '',
    meaning: item.meaning || legacy.meaning || '',
    example: item.example || legacy.example || '',
    usageContext: item.usageContext || legacy.usageContext || '',
    note: item.note || legacy.note || '',
    synonym: item.synonym || legacy.synonym || '',
    antonym: item.antonym || legacy.antonym || '',
    singularForm: item.singularForm || legacy.singularForm || '',
    pluralForm: item.pluralForm || legacy.pluralForm || '',
    v2Form: item.v2Form || legacy.v2Form || '',
    v3Form: item.v3Form || legacy.v3Form || '',
    imageUrl: item.image || null,
  };
}

function sanitizeAIDraft(input: Partial<AIVocabularyDraft>): AIVocabularyDraft {
  return {
    word: capitalizeVocabularyWord(input.word || ''),
    pronunciation: input.pronunciation?.trim() || '',
    grammar: input.grammar?.trim() || '',
    category: input.category?.trim() || '',
    meaning: input.meaning?.trim() || '',
    example: input.example?.trim() || '',
    usageContext: input.usageContext?.trim() || '',
    note: input.note?.trim() || '',
    synonym: input.synonym?.trim() || '',
    antonym: input.antonym?.trim() || '',
    singularForm: input.singularForm?.trim() || '',
    pluralForm: input.pluralForm?.trim() || '',
    v2Form: input.v2Form?.trim() || '',
    v3Form: input.v3Form?.trim() || '',
  };
}

function sanitizeAIWordFamilyDraft(input: Partial<AIWordFamilyDraft>): AIWordFamilyDraft {
  return {
    ...sanitizeAIDraft(input),
    relation: input.relation?.trim() || '',
  };
}

function mapDraftToFamilyMember(draft: AIVocabularyDraft, relation?: string): VocabularyFamilyMember {
  return {
    word: capitalizeVocabularyWord(draft.word),
    grammar: draft.grammar.trim(),
    relation: relation?.trim() || draft.grammar.trim(),
    meaning: draft.meaning.trim(),
    example: draft.example.trim(),
    usageContext: draft.usageContext.trim(),
    note: draft.note.trim(),
  };
}

function mergeWordFamilyDrafts(primary: AIVocabularyDraft, related: AIWordFamilyDraft[]): AIWordFamilyDraft[] {
  const merged = new Map<string, AIWordFamilyDraft>();

  const pushDraft = (draft: AIWordFamilyDraft) => {
    const key = normalizeVocabularyWord(draft.word);

    if (!key) {
      return;
    }

    if (!merged.has(key)) {
      merged.set(key, draft);
      return;
    }

    const existing = merged.get(key)!;
    merged.set(key, {
      ...existing,
      pronunciation: existing.pronunciation || draft.pronunciation,
      grammar: existing.grammar || draft.grammar,
      relation: existing.relation || draft.relation,
      category: existing.category || draft.category,
      meaning: existing.meaning || draft.meaning,
      example: existing.example || draft.example,
      usageContext: existing.usageContext || draft.usageContext,
      note: existing.note || draft.note,
      synonym: existing.synonym || draft.synonym,
      antonym: existing.antonym || draft.antonym,
      singularForm: existing.singularForm || draft.singularForm,
      pluralForm: existing.pluralForm || draft.pluralForm,
      v2Form: existing.v2Form || draft.v2Form,
      v3Form: existing.v3Form || draft.v3Form,
    });
  };

  pushDraft({
    ...sanitizeAIDraft(primary),
    relation: 'core',
  });

  for (const entry of related) {
    pushDraft(sanitizeAIWordFamilyDraft(entry));
  }

  return [...merged.values()];
}

function mapItemFromApi(created: any): VocabularyItem {
  return {
    id: created.id,
    word: created.word,
    pronunciation: created.pronunciation,
    grammar: created.grammar,
    category: created.category,
    notes: created.notes,
    image: created.image,
    createdAt: created.createdAt,
    meaning: created.meaning,
    example: created.example,
    usageContext: created.usageContext,
    note: created.note,
    synonym: created.synonym,
    antonym: created.antonym,
    singularForm: created.singularForm,
    pluralForm: created.pluralForm,
    v2Form: created.v2Form,
    v3Form: created.v3Form,
  };
}

export function VocabularyFormManager({ initialVocabulary }: VocabularyFormManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedIdFromQuery = searchParams.get('id');
  const initialTopics = getVocabularyCategoryStats(initialVocabulary).map((entry) => entry.category);

  const { data: session } = useSession();

  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>(initialVocabulary);
  const [manageSearch, setManageSearch] = useState('');
  const [form, setForm] = useState<VocabularyFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiMode, setAiMode] = useState<AIMode>(null);

  const [lookupInput, setLookupInput] = useState('');
  const [manualTopicMode, setManualTopicMode] = useState<TopicMode>(initialTopics.length > 0 ? 'existing' : 'new');
  const [manualSelectedTopic, setManualSelectedTopic] = useState(initialTopics[0] || '');
  const [manualNewTopic, setManualNewTopic] = useState('');

  const [aiTopicMode, setAiTopicMode] = useState<TopicMode>(initialTopics.length > 0 ? 'existing' : 'new');
  const [aiSelectedTopic, setAiSelectedTopic] = useState(initialTopics[0] || '');
  const [aiNewTopic, setAiNewTopic] = useState('');

  const [topicCount, setTopicCount] = useState(8);
  const [quickGrammarFilters, setQuickGrammarFilters] = useState<QuickGrammarFilter[]>([]);
  const [generatedVocabulary, setGeneratedVocabulary] = useState<AIVocabularyDraft[]>([]);
  const [wordFamilyDrafts, setWordFamilyDrafts] = useState<AIWordFamilyDraft[]>([]);
  const [wordFamilyKey, setWordFamilyKey] = useState('');
  const [savingWordFamily, setSavingWordFamily] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState<string | null>(null);

  const [status, setStatus] = useState<StatusState | null>(null);

  const topicStats = useMemo(() => getVocabularyCategoryStats(vocabulary), [vocabulary]);
  const topicOptions = useMemo(() => topicStats.map((entry) => entry.category), [topicStats]);

  const visibleVocabulary = useMemo(() => {
    const q = manageSearch.trim().toLowerCase();

    return [...vocabulary]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .filter((item) => {
        if (!q) {
          return true;
        }

        const blob = [item.word, item.pronunciation, item.grammar, item.category, item.meaning, item.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return blob.includes(q);
      });
  }, [manageSearch, vocabulary]);

  const selectedItem = useMemo(
    () => (editingId ? vocabulary.find((item) => item.id === editingId) || null : null),
    [editingId, vocabulary]
  );

  const syncManualTopicControls = (rawCategory?: string | null) => {
    const normalizedCategory = normalizeVocabularyCategory(rawCategory);
    const matchedExistingTopic = findExistingVocabularyCategory(normalizedCategory, topicOptions);

    if (matchedExistingTopic) {
      setManualTopicMode('existing');
      setManualSelectedTopic(matchedExistingTopic);
      setManualNewTopic('');
      return;
    }

    if (!normalizedCategory && topicOptions.length > 0) {
      setManualTopicMode('existing');
      setManualSelectedTopic(topicOptions[0]);
      setManualNewTopic('');
      return;
    }

    setManualTopicMode('new');
    setManualNewTopic(normalizedCategory);
  };

  const getResolvedManualCategory = (): string | null => {
    if (manualTopicMode === 'existing') {
      return resolveVocabularyCategory(manualSelectedTopic, topicOptions);
    }

    return resolveVocabularyCategory(manualNewTopic || form.category, topicOptions);
  };

  const getResolvedAITopic = (): string => {
    const topicCandidate = aiTopicMode === 'existing' ? aiSelectedTopic : aiNewTopic;
    return normalizeVocabularyCategory(topicCandidate);
  };

  useEffect(() => {
    if (topicOptions.length === 0) {
      setManualTopicMode('new');
      setManualSelectedTopic('');
      setAiTopicMode('new');
      setAiSelectedTopic('');
      return;
    }

    setManualSelectedTopic((prev) => findExistingVocabularyCategory(prev, topicOptions) || topicOptions[0]);
    setAiSelectedTopic((prev) => findExistingVocabularyCategory(prev, topicOptions) || topicOptions[0]);
  }, [topicOptions]);

  useEffect(() => {
    if (!selectedIdFromQuery) {
      const defaultTopic = topicOptions[0] || '';

      setEditingId(null);
      setForm({
        ...initialFormState,
        category: defaultTopic,
      });
      syncManualTopicControls(defaultTopic);
      setImageFile(null);
      setImagePreview(null);
      setWordFamilyDrafts([]);
      setWordFamilyKey('');
      return;
    }

    const item = vocabulary.find((entry) => entry.id === selectedIdFromQuery);

    if (!item) {
      setStatus({ type: 'error', message: 'Không tìm thấy từ cần sửa. Vui lòng chọn từ khác.' });
      return;
    }

    setEditingId(item.id);
    setForm(toFormState(item));
    syncManualTopicControls(item.category);
    setImageFile(null);
    setImagePreview(item.image || null);

    const familyExtracted = extractVocabularyFamilyMeta(item.notes);

    if (familyExtracted.meta) {
      const selectedKey = normalizeVocabularyWord(item.word);
      const relatedDrafts = familyExtracted.meta.members
        .filter((member) => normalizeVocabularyWord(member.word) !== selectedKey)
        .map((member) =>
          sanitizeAIWordFamilyDraft({
            word: member.word,
            grammar: member.grammar,
            relation: member.relation,
            meaning: member.meaning,
            example: member.example,
            usageContext: member.usageContext,
            note: member.note,
            category: item.category || '',
          })
        )
        .filter((member) => member.word);

      setWordFamilyDrafts(relatedDrafts);
      setWordFamilyKey(familyExtracted.meta.familyKey || deriveVocabularyFamilyKey(item.word));
    } else {
      setWordFamilyDrafts([]);
      setWordFamilyKey('');
    }
  }, [selectedIdFromQuery, topicOptions, vocabulary]);

  const setQueryId = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (id) {
      params.set('id', id);
    } else {
      params.delete('id');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const resetFormForNew = () => {
    const defaultTopic = topicOptions[0] || '';

    setEditingId(null);
    setForm({
      ...initialFormState,
      category: defaultTopic,
    });
    syncManualTopicControls(defaultTopic);
    setImageFile(null);
    setImagePreview(null);
    setWordFamilyDrafts([]);
    setWordFamilyKey('');
    setStatus(null);
    setQueryId(null);
  };

  const onFieldChange = (field: keyof VocabularyFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview(form.imageUrl);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeCurrentImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((prev) => ({ ...prev, imageUrl: null }));
  };

  const applyDraftToForm = (draft: AIVocabularyDraft) => {
    const normalizedCategory = normalizeVocabularyCategory(draft.category);

    setForm((prev) => ({
      ...prev,
      word: draft.word,
      pronunciation: draft.pronunciation,
      grammar: draft.grammar,
      category: normalizedCategory,
      meaning: draft.meaning,
      example: draft.example,
      usageContext: draft.usageContext,
      note: draft.note,
      synonym: draft.synonym,
      antonym: draft.antonym,
      singularForm: draft.singularForm,
      pluralForm: draft.pluralForm,
      v2Form: draft.v2Form,
      v3Form: draft.v3Form,
    }));

    syncManualTopicControls(normalizedCategory);
  };

  const onManualTopicModeChange = (mode: TopicMode) => {
    setManualTopicMode(mode);

    if (mode === 'existing') {
      const selectedTopic = findExistingVocabularyCategory(manualSelectedTopic, topicOptions) || topicOptions[0] || '';
      setManualSelectedTopic(selectedTopic);
      onFieldChange('category', selectedTopic);
      return;
    }

    onFieldChange('category', manualNewTopic);
  };

  const onManualExistingTopicChange = (value: string) => {
    const resolved = findExistingVocabularyCategory(value, topicOptions) || value;
    setManualSelectedTopic(resolved);
    onFieldChange('category', resolved);
  };

  const onManualNewTopicChange = (value: string) => {
    setManualNewTopic(value);
    onFieldChange('category', value);
  };

  const onAITopicModeChange = (mode: TopicMode) => {
    setAiTopicMode(mode);

    if (mode === 'existing') {
      const selectedTopic = findExistingVocabularyCategory(aiSelectedTopic, topicOptions) || topicOptions[0] || '';
      setAiSelectedTopic(selectedTopic);
      return;
    }

    setAiNewTopic('');
  };

  const onAIAutofill = async () => {
    if (!session?.user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để sử dụng tính năng AI.' });
      return;
    }

    if (!lookupInput.trim()) {
      setStatus({ type: 'error', message: 'Nhập từ khóa tiếng Việt hoặc tiếng Anh để AI điền tự động.' });
      return;
    }

    try {
      setAiMode('enrich');
      setStatus(null);

      const res = await fetch('/api/vocab/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enrich-from-term',
          term: lookupInput.trim(),
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || 'Không thể tạo dữ liệu từ AI.');
      }

      const draft = sanitizeAIDraft(payload?.item || {});

      if (!draft.word) {
        throw new Error('AI chưa trả về từ vựng hợp lệ, vui lòng thử lại.');
      }

      const familyDrafts = Array.isArray(payload?.wordFamily)
        ? payload.wordFamily
            .map((entry: Partial<AIWordFamilyDraft>) => sanitizeAIWordFamilyDraft(entry))
            .filter((entry: AIWordFamilyDraft) => {
              if (!entry.word) {
                return false;
              }

              return normalizeVocabularyWord(entry.word) !== normalizeVocabularyWord(draft.word);
            })
        : [];

      const dedupedFamilyDrafts = mergeWordFamilyDrafts(draft, familyDrafts).filter(
        (entry) => normalizeVocabularyWord(entry.word) !== normalizeVocabularyWord(draft.word)
      );

      const aiFamilyKey =
        typeof payload?.familyKey === 'string' && payload.familyKey.trim()
          ? payload.familyKey.trim()
          : deriveVocabularyFamilyKey(draft.word);

      setWordFamilyDrafts(dedupedFamilyDrafts);
      setWordFamilyKey(aiFamilyKey);

      applyDraftToForm(draft);
      setStatus({
        type: 'success',
        message: `AI đã điền từ "${draft.word}" cùng ${dedupedFamilyDrafts.length} biến thể liên quan chuẩn IELTS.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setAiMode(null);
    }
  };

  const toggleQuickGrammarFilter = (value: QuickGrammarFilter) => {
    setQuickGrammarFilters((prev) =>
      prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]
    );
  };

  const onGenerateByTopic = async () => {
    if (!session?.user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để sử dụng tính năng AI.' });
      return;
    }

    const selectedTopic = getResolvedAITopic();

    if (!selectedTopic) {
      setStatus({ type: 'error', message: 'Nhập một chủ đề để AI tạo danh sách từ vựng.' });
      return;
    }

    try {
      setAiMode('generate-topic');
      setStatus(null);

      const res = await fetch('/api/vocab/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-from-topic',
          topic: selectedTopic,
          count: topicCount,
          grammarFilters: quickGrammarFilters,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || 'Không thể tạo danh sách từ theo chủ đề.');
      }

      const items = Array.isArray(payload?.items)
        ? payload.items
            .map((item: Partial<AIVocabularyDraft>) => sanitizeAIDraft(item))
            .filter((item: AIVocabularyDraft) => item.word)
        : [];

      const resolvedTopic = normalizeVocabularyCategory(payload?.topic || selectedTopic);

      const detailedItems = items
        .map((item: AIVocabularyDraft) => ({
          ...item,
          category: resolvedTopic || item.category,
        }))
        .filter((item: AIVocabularyDraft) => hasDetailedQuickDraft(item));

      if (detailedItems.length === 0) {
        throw new Error('AI chưa tạo được danh sách đủ chi tiết, vui lòng thử lại với chủ đề cụ thể hơn.');
      }

      setGeneratedVocabulary(detailedItems);

      if (resolvedTopic) {
        if (aiTopicMode === 'existing') {
          setAiSelectedTopic(resolvedTopic);
        } else {
          setAiNewTopic(resolvedTopic);
        }
      }

      const selectedGrammarLabels =
        quickGrammarFilters.length === 0
          ? 'mọi loại từ'
          : quickGrammarOptions
              .filter((option) => quickGrammarFilters.includes(option.value))
              .map((option) => option.label)
              .join(', ');
      const warningSuffix = payload?.warning ? ` ${payload.warning}` : '';
      setStatus({
        type: 'success',
        message: `AI đã tạo ${detailedItems.length} từ vựng theo chủ đề "${resolvedTopic || selectedTopic}" (${selectedGrammarLabels}).${warningSuffix}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setAiMode(null);
    }
  };

  const getPrimaryDraftFromForm = (): AIVocabularyDraft => ({
    word: capitalizeVocabularyWord(form.word),
    pronunciation: form.pronunciation,
    grammar: form.grammar,
    category: getResolvedManualCategory() || form.category,
    meaning: form.meaning,
    example: form.example,
    usageContext: form.usageContext,
    note: form.note,
    synonym: form.synonym,
    antonym: form.antonym,
    singularForm: form.singularForm,
    pluralForm: form.pluralForm,
    v2Form: form.v2Form,
    v3Form: form.v3Form,
  });

  const buildFamilyMetaFromCurrentState = () => {
    if (wordFamilyDrafts.length === 0) {
      return null;
    }

    const primaryDraft = getPrimaryDraftFromForm();
    const mergedFamily = mergeWordFamilyDrafts(primaryDraft, wordFamilyDrafts);

    if (mergedFamily.length < 2) {
      return null;
    }

    const familyKey = wordFamilyKey || deriveVocabularyFamilyKey(primaryDraft.word);

    return {
      familyKey,
      members: mergedFamily.map((entry) => mapDraftToFamilyMember(entry, entry.relation || entry.grammar)),
    };
  };

  const buildPayload = (imageUrl: string | null) => {
    const resolvedCategory = getResolvedManualCategory();
    const baseNotes =
      buildVocabularyNotes({
        meaning: form.meaning,
        example: form.example,
        usageContext: form.usageContext,
        note: form.note,
        synonym: form.synonym,
        antonym: form.antonym,
        singularForm: form.singularForm,
        pluralForm: form.pluralForm,
        v2Form: form.v2Form,
        v3Form: form.v3Form,
      }) || null;
    const familyMeta = buildFamilyMetaFromCurrentState();
    const notesWithFamily = upsertVocabularyFamilyMeta(baseNotes, familyMeta);

    return {
      word: capitalizeVocabularyWord(form.word),
      pronunciation: form.pronunciation.trim() || null,
      grammar: form.grammar.trim() || null,
      category: resolvedCategory,
      meaning: form.meaning.trim() || null,
      example: form.example.trim() || null,
      usageContext: form.usageContext.trim() || null,
      note: form.note.trim() || null,
      synonym: form.synonym.trim() || null,
      antonym: form.antonym.trim() || null,
      singularForm: form.singularForm.trim() || null,
      pluralForm: form.pluralForm.trim() || null,
      v2Form: form.v2Form.trim() || null,
      v3Form: form.v3Form.trim() || null,
      image: imageUrl,
      notes: notesWithFamily,
    };
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để lưu từ vựng vào tài khoản.' });
      return;
    }

    if (!form.word.trim()) {
      setStatus({ type: 'error', message: 'Từ vựng không được để trống.' });
      return;
    }

    try {
      setSubmitting(true);
      setStatus(null);

      let imageUrl: string | null = form.imageUrl;

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'myelts/vocab');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Không thể tải ảnh minh họa.');
        }

        const uploadPayload = await uploadRes.json();
        imageUrl = uploadPayload.url;
      }

      const payload = buildPayload(imageUrl);
      const endpoint = editingId ? `/api/vocab/${editingId}` : '/api/vocab';
      const method = editingId ? 'PUT' : 'POST';

      const saveRes = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const saved = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saved?.error || 'Không thể lưu từ vựng.');
      }

      const savedItem = mapItemFromApi(saved);

      if (editingId) {
        setVocabulary((prev) => prev.map((item) => (item.id === editingId ? savedItem : item)));
        setStatus({ type: 'success', message: `Đã cập nhật từ "${savedItem.word}".` });
      } else {
        setVocabulary((prev) => [savedItem, ...prev]);
        setStatus({ type: 'success', message: `Đã thêm "${savedItem.word}" vào danh sách của bạn.` });
      }

      setEditingId(savedItem.id);
      setForm(toFormState(savedItem));
      syncManualTopicControls(savedItem.category);
      setImageFile(null);
      setImagePreview(savedItem.image || null);
      setQueryId(savedItem.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteCurrent = async () => {
    if (!editingId) {
      return;
    }

    if (!session?.user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để xóa từ vựng.' });
      return;
    }

    try {
      setDeleting(true);
      setStatus(null);

      const deleteRes = await fetch(`/api/vocab/${editingId}`, {
        method: 'DELETE',
      });

      const payload = await deleteRes.json();

      if (!deleteRes.ok) {
        throw new Error(payload?.error || 'Không thể xóa từ vựng.');
      }

      setVocabulary((prev) => prev.filter((item) => item.id !== editingId));
      resetFormForNew();
      setStatus({ type: 'success', message: 'Đã xóa từ vựng thành công.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setDeleting(false);
    }
  };

  const onDeleteTopic = async (topic: string) => {
    if (!session?.user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để xóa chủ đề.' });
      return;
    }

    const resolvedTopic = findExistingVocabularyCategory(topic, topicOptions) || normalizeVocabularyCategory(topic);

    if (!resolvedTopic) {
      setStatus({ type: 'error', message: 'Chủ đề không hợp lệ.' });
      return;
    }

    const confirmed = window.confirm(
      `Xóa chủ đề "${resolvedTopic}" sẽ xóa toàn bộ từ vựng bên trong. Bạn có chắc chắn muốn tiếp tục?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTopic(resolvedTopic);
      setStatus(null);

      const deleteRes = await fetch('/api/vocab/topics', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: resolvedTopic }),
      });

      const payload = await deleteRes.json();

      if (!deleteRes.ok) {
        throw new Error(payload?.error || 'Không thể xóa chủ đề.');
      }

      const deletedTopic = normalizeVocabularyCategory(payload?.topic || resolvedTopic);
      const deletedTopicKey = normalizeVocabularyCategoryKey(deletedTopic);

      setVocabulary((prev) => prev.filter((item) => normalizeVocabularyCategoryKey(item.category) !== deletedTopicKey));

      if (selectedItem && normalizeVocabularyCategoryKey(selectedItem.category) === deletedTopicKey) {
        resetFormForNew();
      }

      const deletedCount = Number(payload?.deletedCount || 0);
      setStatus({
        type: 'success',
        message: `Đã xóa chủ đề "${deletedTopic}" và ${deletedCount} từ vựng liên quan.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setDeletingTopic(null);
    }
  };

  const onSaveWordFamily = async () => {
    if (!session?.user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để lưu bộ từ liên quan.' });
      return;
    }

    const primaryDraft = getPrimaryDraftFromForm();

    if (!primaryDraft.word.trim()) {
      setStatus({ type: 'error', message: 'Cần có từ chính trước khi lưu bộ từ liên quan.' });
      return;
    }

    const mergedFamily = mergeWordFamilyDrafts(primaryDraft, wordFamilyDrafts);

    if (mergedFamily.length < 2) {
      setStatus({ type: 'error', message: 'Chưa có biến thể liên quan để lưu.' });
      return;
    }

    try {
      setSavingWordFamily(true);
      setStatus(null);

      const localSet = new Set(vocabulary.map((item) => normalizeVocabularyWord(item.word)));
      const createdItems: VocabularyItem[] = [];

      let createdCount = 0;
      let skippedCount = 0;

      const familyKey = wordFamilyKey || deriveVocabularyFamilyKey(primaryDraft.word);
      const familyMembers = mergedFamily.map((entry) => mapDraftToFamilyMember(entry, entry.relation || entry.grammar));

      for (const draft of mergedFamily) {
        const key = normalizeVocabularyWord(draft.word);

        if (!key || localSet.has(key)) {
          skippedCount += 1;
          continue;
        }

        const notes = upsertVocabularyFamilyMeta(
          buildVocabularyNotes({
            meaning: draft.meaning,
            example: draft.example,
            usageContext: draft.usageContext,
            note: draft.note,
            synonym: draft.synonym,
            antonym: draft.antonym,
            singularForm: draft.singularForm,
            pluralForm: draft.pluralForm,
            v2Form: draft.v2Form,
            v3Form: draft.v3Form,
          }) || null,
          {
            familyKey,
            members: familyMembers,
          }
        );

        const createRes = await fetch('/api/vocab', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            word: draft.word,
            pronunciation: draft.pronunciation || null,
            grammar: draft.grammar || null,
            category: draft.category || null,
            meaning: draft.meaning || null,
            example: draft.example || null,
            usageContext: draft.usageContext || null,
            note: draft.note || null,
            synonym: draft.synonym || null,
            antonym: draft.antonym || null,
            singularForm: draft.singularForm || null,
            pluralForm: draft.pluralForm || null,
            v2Form: draft.v2Form || null,
            v3Form: draft.v3Form || null,
            image: null,
            notes,
          }),
        });

        const payload = await createRes.json();

        if (createRes.ok) {
          createdItems.push(mapItemFromApi(payload));
          localSet.add(key);
          createdCount += 1;
          continue;
        }

        if (createRes.status === 409) {
          localSet.add(key);
          skippedCount += 1;
          continue;
        }

        throw new Error(payload?.error || `Không thể lưu biến thể "${draft.word}".`);
      }

      if (createdItems.length > 0) {
        setVocabulary((prev) => [...createdItems, ...prev]);
      }

      setStatus({
        type: createdCount > 0 ? 'success' : 'error',
        message:
          createdCount > 0
            ? `Đã lưu ${createdCount} từ trong bộ word family IELTS.${skippedCount ? ` Bỏ qua ${skippedCount} từ trùng.` : ''}`
            : 'Không có biến thể mới để lưu (toàn bộ đã trùng).',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setSavingWordFamily(false);
    }
  };

  const onSaveGeneratedVocabulary = async () => {
    if (!session?.user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để lưu danh sách AI.' });
      return;
    }

    if (generatedVocabulary.length === 0) {
      setStatus({ type: 'error', message: 'Chưa có danh sách AI để lưu.' });
      return;
    }

    try {
      setAiMode('save-generated');
      setStatus(null);

      const localSet = new Set(vocabulary.map((item) => normalizeVocabularyWord(item.word)));
      const createdItems: VocabularyItem[] = [];

      let createdCount = 0;
      let skippedCount = 0;
      let skippedIncompleteCount = 0;

      for (const draft of generatedVocabulary) {
        if (!hasDetailedQuickDraft(draft)) {
          skippedIncompleteCount += 1;
          continue;
        }

        const key = normalizeVocabularyWord(draft.word);

        if (!key || localSet.has(key)) {
          skippedCount += 1;
          continue;
        }

        const createRes = await fetch('/api/vocab', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            word: draft.word,
            pronunciation: draft.pronunciation || null,
            grammar: draft.grammar || null,
            category: draft.category || null,
            meaning: draft.meaning || null,
            example: draft.example || null,
            usageContext: draft.usageContext || null,
            note: draft.note || null,
            synonym: draft.synonym || null,
            antonym: draft.antonym || null,
            singularForm: draft.singularForm || null,
            pluralForm: draft.pluralForm || null,
            v2Form: draft.v2Form || null,
            v3Form: draft.v3Form || null,
            image: null,
            notes:
              buildVocabularyNotes({
                meaning: draft.meaning,
                example: draft.example,
                usageContext: draft.usageContext,
                note: draft.note,
                synonym: draft.synonym,
                antonym: draft.antonym,
                singularForm: draft.singularForm,
                pluralForm: draft.pluralForm,
                v2Form: draft.v2Form,
                v3Form: draft.v3Form,
              }) || null,
          }),
        });

        const createdPayload = await createRes.json();

        if (createRes.ok) {
          createdItems.push(mapItemFromApi(createdPayload));
          localSet.add(key);
          createdCount += 1;
          continue;
        }

        if (createRes.status === 409) {
          localSet.add(key);
          skippedCount += 1;
          continue;
        }

        throw new Error(createdPayload?.error || `Không thể lưu từ "${draft.word}".`);
      }

      if (createdItems.length > 0) {
        setVocabulary((prev) => [...createdItems, ...prev]);
      }

      setGeneratedVocabulary([]);

      if (createdCount > 0) {
        const skippedDetailText = skippedIncompleteCount
          ? ` Bỏ qua ${skippedIncompleteCount} từ chưa đủ chi tiết.`
          : '';
        setStatus({
          type: 'success',
          message: `Đã lưu ${createdCount} từ mới vào cơ sở dữ liệu.${skippedCount ? ` Bỏ qua ${skippedCount} từ trùng.` : ''}${skippedDetailText}`,
        });
      } else {
        setStatus({
          type: 'error',
          message:
            skippedIncompleteCount > 0
              ? 'Không có từ mới nào để lưu vì dữ liệu chưa đủ chi tiết hoặc bị trùng.'
              : 'Không có từ mới nào để lưu (toàn bộ đã trùng).',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setAiMode(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/vocabulary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về danh sách
          </Link>
        </Button>

        <Button type="button" onClick={resetFormForNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tạo từ mới
        </Button>
      </div>

      {status ? (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-red-300 bg-red-50 text-red-700'
          }`}
        >
          {status.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          <span>{status.message}</span>
        </div>
      ) : null}

      {!session?.user ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Đăng nhập để thêm, cập nhật và xóa từ vựng trong tài khoản của bạn.
          <div className="mt-3">
            <Button asChild variant="outline" className="border-amber-400 bg-white">
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" />
                Đăng nhập ngay
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-white via-white to-primary/5 shadow-lg">
          <CardHeader className="border-b border-primary/10 bg-white/80 backdrop-blur">
            <CardTitle className="flex items-center gap-2 text-2xl text-text-main">
              <PlusCircle className="h-6 w-6 text-primary" />
              {editingId ? 'Cập nhật từ vựng' : 'Tạo từ vựng chi tiết'}
            </CardTitle>
            <CardDescription>
              Biểu mẫu quản lý riêng cho phép bạn thêm, sửa, xóa từ vựng và bổ sung đầy đủ từ đồng nghĩa/trái nghĩa, số ít-số nhiều, V2/V3.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-primary/15 bg-white p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text-main">
                  <WandSparkles className="h-4 w-4 text-primary" />
                  AI điền tự động từ khóa Việt hoặc Anh
                </h3>
                <Input
                  value={lookupInput}
                  onChange={(event) => setLookupInput(event.target.value)}
                  placeholder="Ví dụ: sự đồng cảm, empathy, meticulous"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={aiMode !== null || savingWordFamily || !session?.user}
                  onClick={onAIAutofill}
                  className="w-full border-primary/40"
                >
                  {aiMode === 'enrich' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI đang điền...
                    </>
                  ) : (
                    'Điền form bằng AI'
                  )}
                </Button>
              </div>

              <div className="space-y-3 rounded-lg border border-primary/15 bg-white p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text-main">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI tạo 5-20 từ theo chủ đề
                </h3>

                <div className="space-y-2">
                  <Label>Chế độ chủ đề</Label>
                  <div className="flex flex-wrap gap-2">
                    <ChipFilter
                      label="Chọn chủ đề có sẵn"
                      isActive={aiTopicMode === 'existing'}
                      onClick={() => {
                        if (topicOptions.length > 0) {
                          onAITopicModeChange('existing');
                        }
                      }}
                    />
                    <ChipFilter
                      label="Thêm chủ đề mới"
                      isActive={aiTopicMode === 'new'}
                      onClick={() => onAITopicModeChange('new')}
                    />
                  </div>
                </div>

                {aiTopicMode === 'existing' && topicOptions.length > 0 ? (
                  <div className="space-y-1">
                    <Label htmlFor="aiExistingTopic">Chủ đề có sẵn</Label>
                    <select
                      id="aiExistingTopic"
                      value={aiSelectedTopic}
                      onChange={(event) => setAiSelectedTopic(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {topicOptions.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label htmlFor="aiNewTopic">Chủ đề mới</Label>
                    <Input
                      id="aiNewTopic"
                      value={aiNewTopic}
                      onChange={(event) => setAiNewTopic(event.target.value)}
                      placeholder="Ví dụ: Biến đổi khí hậu"
                    />
                  </div>
                )}

                {topicOptions.length === 0 ? (
                  <p className="text-xs text-text-muted">Chưa có chủ đề nào trong dữ liệu, vui lòng thêm chủ đề mới.</p>
                ) : null}

                <div className="space-y-1">
                  <Label htmlFor="topicCount">Số lượng từ</Label>
                  <select
                    id="topicCount"
                    value={topicCount}
                    onChange={(event) => setTopicCount(Number(event.target.value))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {topicCountOptions.map((count) => (
                      <option key={count} value={count}>
                        {count} từ
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Loại từ mục tiêu</Label>
                  <div className="flex flex-wrap gap-2">
                    <ChipFilter
                      label="Tất cả loại từ"
                      isActive={quickGrammarFilters.length === 0}
                      onClick={() => setQuickGrammarFilters([])}
                    />
                    {quickGrammarOptions.map((option) => (
                      <ChipFilter
                        key={option.value}
                        label={option.label}
                        isActive={quickGrammarFilters.includes(option.value)}
                        onClick={() => toggleQuickGrammarFilter(option.value)}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted">Bạn có thể chọn nhiều loại từ cùng lúc để tạo danh sách kết hợp.</p>
                </div>

                <Button
                  type="button"
                  disabled={aiMode !== null || savingWordFamily || !session?.user}
                  onClick={onGenerateByTopic}
                  className="w-full"
                >
                  {aiMode === 'generate-topic' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI đang tạo danh sách...
                    </>
                  ) : (
                    'Tạo danh sách theo chủ đề'
                  )}
                </Button>
              </div>
            </div>

            {wordFamilyDrafts.length > 0 ? (
              <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 via-white to-secondary/20 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-main">Bảng Word Family IELTS</p>
                    <p className="text-xs text-text-muted">
                      AI đã tạo {wordFamilyDrafts.length} biến thể liên quan (noun/verb/adjective/adverb...) để bạn chuyển đổi ngay trong form.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingWordFamily || aiMode !== null || !session?.user}
                    onClick={onSaveWordFamily}
                    className="border-primary/40"
                  >
                    {savingWordFamily ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu bộ từ...
                      </>
                    ) : (
                      'Lưu toàn bộ Word Family'
                    )}
                  </Button>
                </div>

                <div className="mt-3 overflow-x-auto rounded-lg border border-primary/15 bg-white">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-primary/10 text-xs uppercase tracking-wide text-primary-dark">
                      <tr>
                        <th className="px-3 py-2">Từ liên quan</th>
                        <th className="px-3 py-2">Loại từ</th>
                        <th className="px-3 py-2">Vai trò</th>
                        <th className="px-3 py-2">Nghĩa</th>
                        <th className="px-3 py-2 text-right">Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wordFamilyDrafts.map((entry, index) => (
                        <tr key={`${entry.word}-${index}`} className="border-t border-primary/10 align-top">
                          <td className="px-3 py-2 font-semibold text-text-main">{entry.word}</td>
                          <td className="px-3 py-2 text-text-muted">{entry.grammar || 'related form'}</td>
                          <td className="px-3 py-2 text-text-muted">{entry.relation || entry.grammar || 'related'}</td>
                          <td className="px-3 py-2 text-text-muted line-clamp-2">{entry.meaning || entry.note || 'Chưa có mô tả'}</td>
                          <td className="px-3 py-2 text-right">
                            <Button type="button" size="sm" variant="ghost" onClick={() => applyDraftToForm(entry)}>
                              Nạp vào form
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {generatedVocabulary.length > 0 ? (
              <div className="rounded-xl border border-primary/20 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-text-muted">
                    AI đã tạo {generatedVocabulary.length} từ. Nhấn vào từng từ để đổ vào form, hoặc lưu tất cả vào cơ sở dữ liệu.
                  </p>
                  <Button
                    type="button"
                    disabled={aiMode !== null || savingWordFamily || !session?.user}
                    onClick={onSaveGeneratedVocabulary}
                    className="md:w-auto"
                  >
                    {aiMode === 'save-generated' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu tất cả vào cơ sở dữ liệu'
                    )}
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {generatedVocabulary.map((item, index) => (
                    <button
                      key={`${item.word}-${index}`}
                      type="button"
                      onClick={() => applyDraftToForm(item)}
                      className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10"
                    >
                      <p className="font-semibold text-text-main">{item.word}</p>
                      <p className="text-xs text-text-muted">{item.pronunciation || 'Chưa có IPA'}</p>
                      <p className="mt-1 text-sm text-text-muted line-clamp-2">{item.meaning || item.note || 'Nhấn để sử dụng dữ liệu này.'}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="word">Từ vựng tiếng Anh *</Label>
                  <Input
                    id="word"
                    value={form.word}
                    onChange={(event) => onFieldChange('word', event.target.value)}
                    placeholder="Ví dụ: empathy, meticulous, resilient"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pronunciation">Phiên âm</Label>
                  <Input
                    id="pronunciation"
                    value={form.pronunciation}
                    onChange={(event) => onFieldChange('pronunciation', event.target.value)}
                    placeholder="/məˈtɪk.jə.ləs/"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grammar">Loại từ</Label>
                  <Input
                    id="grammar"
                    value={form.grammar}
                    onChange={(event) => onFieldChange('grammar', event.target.value)}
                    placeholder="noun, verb, adjective..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chủ đề</Label>
                  <div className="flex flex-wrap gap-2">
                    <ChipFilter
                      label="Chọn chủ đề có sẵn"
                      isActive={manualTopicMode === 'existing'}
                      onClick={() => {
                        if (topicOptions.length > 0) {
                          onManualTopicModeChange('existing');
                        }
                      }}
                    />
                    <ChipFilter
                      label="Thêm chủ đề mới"
                      isActive={manualTopicMode === 'new'}
                      onClick={() => onManualTopicModeChange('new')}
                    />
                  </div>

                  {manualTopicMode === 'existing' && topicOptions.length > 0 ? (
                    <select
                      id="category"
                      value={manualSelectedTopic}
                      onChange={(event) => onManualExistingTopicChange(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {topicOptions.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id="category"
                      value={manualNewTopic}
                      onChange={(event) => onManualNewTopicChange(event.target.value)}
                      placeholder="Education, Work, Environment..."
                    />
                  )}

                  {manualTopicMode === 'existing' && topicOptions.length === 0 ? (
                    <p className="text-xs text-text-muted">Chưa có chủ đề nào, vui lòng thêm chủ đề mới.</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="meaning">Nghĩa (tiếng Việt)</Label>
                  <Textarea
                    id="meaning"
                    rows={3}
                    value={form.meaning}
                    onChange={(event) => onFieldChange('meaning', event.target.value)}
                    placeholder="Nghĩa tiếng Việt"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="example">Ví dụ</Label>
                  <Textarea
                    id="example"
                    rows={3}
                    value={form.example}
                    onChange={(event) => onFieldChange('example', event.target.value)}
                    placeholder="Viết câu ví dụ tiếng Anh để dễ nhớ"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="usageContext">Cách dùng trong ngữ cảnh</Label>
                  <Textarea
                    id="usageContext"
                    rows={3}
                    value={form.usageContext}
                    onChange={(event) => onFieldChange('usageContext', event.target.value)}
                    placeholder="Collocation, register, mẫu câu..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chú thêm</Label>
                  <Textarea
                    id="note"
                    rows={3}
                    value={form.note}
                    onChange={(event) => onFieldChange('note', event.target.value)}
                    placeholder="Lưu ý để tránh lỗi phổ biến"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="synonym">Synonym</Label>
                  <Input
                    id="synonym"
                    value={form.synonym}
                    onChange={(event) => onFieldChange('synonym', event.target.value)}
                    placeholder="meticulous = careful"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="antonym">Antonym</Label>
                  <Input
                    id="antonym"
                    value={form.antonym}
                    onChange={(event) => onFieldChange('antonym', event.target.value)}
                    placeholder="careless"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="singularForm">Số ít</Label>
                  <Input
                    id="singularForm"
                    value={form.singularForm}
                    onChange={(event) => onFieldChange('singularForm', event.target.value)}
                    placeholder="child"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pluralForm">Số nhiều</Label>
                  <Input
                    id="pluralForm"
                    value={form.pluralForm}
                    onChange={(event) => onFieldChange('pluralForm', event.target.value)}
                    placeholder="children"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="v2Form">V2</Label>
                  <Input
                    id="v2Form"
                    value={form.v2Form}
                    onChange={(event) => onFieldChange('v2Form', event.target.value)}
                    placeholder="went"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="v3Form">V3</Label>
                  <Input
                    id="v3Form"
                    value={form.v3Form}
                    onChange={(event) => onFieldChange('v3Form', event.target.value)}
                    placeholder="gone"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="imageUpload">Ảnh minh họa (tùy chọn)</Label>
                  {(imagePreview || form.imageUrl) && (
                    <Button type="button" variant="ghost" onClick={removeCurrentImage}>
                      Xóa ảnh
                    </Button>
                  )}
                </div>

                <label
                  htmlFor="imageUpload"
                  className="flex min-h-36 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-white p-4 text-center transition-colors hover:bg-primary/5"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Xem trước" className="h-28 rounded-lg object-cover" />
                  ) : (
                    <div>
                      <UploadCloud className="mx-auto mb-2 h-6 w-6 text-primary" />
                      <p className="text-sm text-muted-foreground">Nhấn để chọn ảnh cho từ vựng</p>
                    </div>
                  )}
                </label>
                <Input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={onImageChange} />
              </div>

              <div className="flex flex-col gap-3 pt-2 md:flex-row">
                <Button
                  type="submit"
                  disabled={submitting || deleting || aiMode !== null || savingWordFamily || !session?.user}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-dark py-6 text-base text-white"
                >
                  {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật từ vựng' : 'Lưu từ vựng mới'}
                </Button>

                {editingId ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={submitting || deleting || aiMode !== null || savingWordFamily || !session?.user}
                    onClick={onDeleteCurrent}
                    className="w-full rounded-xl py-6 text-base md:w-auto"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xóa...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa từ
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Danh sách để sửa nhanh</CardTitle>
            <CardDescription>Chọn từ đã có để đổ vào form và cập nhật/xóa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={manageSearch}
                onChange={(event) => setManageSearch(event.target.value)}
                className="pl-9"
                placeholder="Tìm từ cần sửa..."
              />
            </div>

            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {visibleVocabulary.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setQueryId(item.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedItem?.id === item.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary/40'
                  }`}
                >
                  <p className="font-semibold text-text-main">{item.word}</p>
                  <p className="text-xs text-text-muted">{item.category || 'Tổng quát'} • {item.grammar || 'Từ vựng'}</p>
                </button>
              ))}

              {visibleVocabulary.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-text-muted">Không tìm thấy từ vựng phù hợp.</p>
              ) : null}
            </div>

            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-main">Xóa chủ đề</p>
                <span className="text-xs text-text-muted">Xóa cả từ bên trong</span>
              </div>

              {topicStats.length === 0 ? (
                <p className="text-xs text-text-muted">Chưa có chủ đề nào để quản lý.</p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {topicStats.map((entry) => (
                    <div
                      key={entry.category}
                      className="flex items-center justify-between gap-2 rounded-md border border-primary/15 bg-white px-2 py-1.5"
                    >
                      <p className="text-xs text-text-main">
                        {entry.category} <span className="text-text-muted">({entry.count})</span>
                      </p>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={deletingTopic !== null || submitting || deleting || aiMode !== null || !session?.user}
                        onClick={() => onDeleteTopic(entry.category)}
                      >
                        {deletingTopic === entry.category ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="sr-only">Xóa chủ đề {entry.category}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
