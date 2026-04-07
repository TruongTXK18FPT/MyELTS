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
import { buildVocabularyNotes } from '@/lib/vocabulary-seed';
import { capitalizeVocabularyWord, normalizeVocabularyWord } from '@/lib/vocabulary';
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

type StatusState = {
  type: 'success' | 'error';
  message: string;
};

type AIMode = 'enrich' | 'generate-topic' | 'save-generated' | null;
type QuickGrammarFilter = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrasal verb' | 'collocation' | 'idiom';

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
  const [topicInput, setTopicInput] = useState('');
  const [topicCount, setTopicCount] = useState(8);
  const [quickGrammarFilters, setQuickGrammarFilters] = useState<QuickGrammarFilter[]>([]);
  const [generatedVocabulary, setGeneratedVocabulary] = useState<AIVocabularyDraft[]>([]);

  const [status, setStatus] = useState<StatusState | null>(null);

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

  useEffect(() => {
    if (!selectedIdFromQuery) {
      setEditingId(null);
      setForm(initialFormState);
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    const item = vocabulary.find((entry) => entry.id === selectedIdFromQuery);

    if (!item) {
      setStatus({ type: 'error', message: 'Không tìm thấy từ cần sửa. Vui lòng chọn từ khác.' });
      return;
    }

    setEditingId(item.id);
    setForm(toFormState(item));
    setImageFile(null);
    setImagePreview(item.image || null);
  }, [selectedIdFromQuery, vocabulary]);

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
    setEditingId(null);
    setForm(initialFormState);
    setImageFile(null);
    setImagePreview(null);
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
    setForm((prev) => ({
      ...prev,
      word: draft.word,
      pronunciation: draft.pronunciation,
      grammar: draft.grammar,
      category: draft.category,
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

      applyDraftToForm(draft);
      setStatus({ type: 'success', message: `AI đã điền tự động thông tin cho từ "${draft.word}".` });
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

    if (!topicInput.trim()) {
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
          topic: topicInput.trim(),
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

      const detailedItems = items.filter((item: AIVocabularyDraft) => hasDetailedQuickDraft(item));

      if (detailedItems.length === 0) {
        throw new Error('AI chưa tạo được danh sách đủ chi tiết, vui lòng thử lại với chủ đề cụ thể hơn.');
      }

      setGeneratedVocabulary(detailedItems);

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
        message: `AI đã tạo ${detailedItems.length} từ vựng theo chủ đề "${topicInput.trim()}" (${selectedGrammarLabels}).${warningSuffix}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setAiMode(null);
    }
  };

  const buildPayload = (imageUrl: string | null) => {
    return {
      word: capitalizeVocabularyWord(form.word),
      pronunciation: form.pronunciation.trim() || null,
      grammar: form.grammar.trim() || null,
      category: form.category.trim() || null,
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
      notes:
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
        }) || null,
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
                  disabled={aiMode !== null || !session?.user}
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
                <Input
                  value={topicInput}
                  onChange={(event) => setTopicInput(event.target.value)}
                  placeholder="Ví dụ: Biến đổi khí hậu"
                />
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
                  disabled={aiMode !== null || !session?.user}
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

            {generatedVocabulary.length > 0 ? (
              <div className="rounded-xl border border-primary/20 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-text-muted">
                    AI đã tạo {generatedVocabulary.length} từ. Nhấn vào từng từ để đổ vào form, hoặc lưu tất cả vào cơ sở dữ liệu.
                  </p>
                  <Button
                    type="button"
                    disabled={aiMode !== null || !session?.user}
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
                  <Label htmlFor="category">Chủ đề</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(event) => onFieldChange('category', event.target.value)}
                    placeholder="Education, Work, Environment..."
                  />
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
                  disabled={submitting || deleting || aiMode !== null || !session?.user}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-dark py-6 text-base text-white"
                >
                  {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật từ vựng' : 'Lưu từ vựng mới'}
                </Button>

                {editingId ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={submitting || deleting || aiMode !== null || !session?.user}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
