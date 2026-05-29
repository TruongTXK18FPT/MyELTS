'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { extractVocabularyFamilyMeta } from '@/lib/vocabulary-family';
import { normalizeVocabularyWord } from '@/lib/vocabulary';
import { ArrowUpRight, Bookmark, Pencil, Sparkles, Volume2 } from 'lucide-react';

export type PronunciationAccent = 'en-US' | 'en-GB';

export type PronunciationSettings = {
  accent: PronunciationAccent;
};

export type VocabularyItem = {
  id: string;
  word: string;
  pronunciation?: string | null;
  grammar?: string | null;
  notes?: string | null;
  category?: string | null;
  image?: string | null;
  createdAt?: string;
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
};

type VocabularyListProps = {
  vocabulary: VocabularyItem[];
  manageBasePath?: string;
  pronunciationSettings?: PronunciationSettings;
  vocabularyByWord?: Map<string, VocabularyItem>;
  onOpenVocabularyItem?: (targetId: string) => void;
  highlightedVocabularyId?: string | null;
};

type ExtraDetail = {
  label: string;
  value: string;
};

type LegacyParsed = {
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
  extras: ExtraDetail[];
};

type WordFamilyVariant = {
  word: string;
  pronunciation: string;
  grammar: string;
  relation: string;
  meaning: string;
  example: string;
  usageContext: string;
  note: string;
};

const defaultPronunciationSettings: PronunciationSettings = {
  accent: 'en-US',
};

function normalizeLangCode(value: string): string {
  return value.toLowerCase().replace(/_/g, '-');
}

function getPreferredVoice(voices: SpeechSynthesisVoice[], accent: PronunciationAccent): SpeechSynthesisVoice | null {
  const normalizedAccent = normalizeLangCode(accent);
  const accentVoices = voices.filter((voice) => normalizeLangCode(voice.lang).startsWith(normalizedAccent));
  const englishVoices = voices.filter((voice) => normalizeLangCode(voice.lang).startsWith('en'));

  const voicePool = accentVoices.length > 0 ? accentVoices : englishVoices;

  if (voicePool.length === 0) {
    return null;
  }

  return voicePool.find((voice) => voice.default) || voicePool[0];
}

function normalizeLabel(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLabeledLine(line: string): { label: string; value: string; rawLabel: string } {
  const splitIndex = line.indexOf(':');

  if (splitIndex < 0) {
    return { label: normalizeLabel(line), value: '', rawLabel: '' };
  }

  const rawLabel = line.slice(0, splitIndex).trim();
  const label = normalizeLabel(rawLabel);
  const value = line
    .slice(splitIndex + 1)
    .replace(/\s*[|•]+\s*$/g, '')
    .trim();

  return { label, value, rawLabel };
}

function parseNotes(notes?: string | null): LegacyParsed {
  if (!notes) {
    return {
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
      extras: [],
    };
  }

  const lines = notes
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let meaning = '';
  let example = '';
  let usageContext = '';
  let note = '';
  let synonym = '';
  let antonym = '';
  let singularForm = '';
  let pluralForm = '';
  let v2Form = '';
  let v3Form = '';

  const extras: ExtraDetail[] = [];

  for (const line of lines) {
    const parsed = parseLabeledLine(line);

    if (!parsed.value) {
      extras.push({ label: 'Thông tin thêm', value: line });
      continue;
    }

    if (parsed.label.startsWith('nghia') || parsed.label.startsWith('meaning')) {
      if (!meaning) {
        meaning = parsed.value;
      }
      continue;
    }

    if (parsed.label.startsWith('vi du') || parsed.label.startsWith('example')) {
      if (!example) {
        example = parsed.value;
      }
      continue;
    }

    if (
      parsed.label.startsWith('ngu canh') ||
      parsed.label.startsWith('cach dung') ||
      parsed.label.startsWith('usage context') ||
      parsed.label.startsWith('context') ||
      parsed.label.startsWith('usage')
    ) {
      if (!usageContext) {
        usageContext = parsed.value;
      }
      continue;
    }

    if (parsed.label.startsWith('ghi chu') || parsed.label.startsWith('note') || parsed.label.startsWith('notes')) {
      if (!note) {
        note = parsed.value;
      }
      continue;
    }

    if (
      parsed.label.startsWith('dong nghia') ||
      parsed.label.startsWith('synonym') ||
      parsed.label.startsWith('synonyms')
    ) {
      if (!synonym) {
        synonym = parsed.value;
      }
      continue;
    }

    if (
      parsed.label.startsWith('trai nghia') ||
      parsed.label.startsWith('antonym') ||
      parsed.label.startsWith('antonyms')
    ) {
      if (!antonym) {
        antonym = parsed.value;
      }
      continue;
    }

    if (parsed.label.startsWith('so it') || parsed.label.startsWith('singular')) {
      if (!singularForm) {
        singularForm = parsed.value;
      }
      continue;
    }

    if (parsed.label.startsWith('so nhieu') || parsed.label.startsWith('plural')) {
      if (!pluralForm) {
        pluralForm = parsed.value;
      }
      continue;
    }

    if (parsed.label === 'v2' || parsed.label.startsWith('v2 form')) {
      if (!v2Form) {
        v2Form = parsed.value;
      }
      continue;
    }

    if (parsed.label === 'v3' || parsed.label.startsWith('v3 form')) {
      if (!v3Form) {
        v3Form = parsed.value;
      }
      continue;
    }

    extras.push({ label: parsed.rawLabel || 'Thông tin thêm', value: parsed.value });
  }

  const uniqueExtras: ExtraDetail[] = [];
  const seenExtraKeys = new Set<string>();

  for (const extra of extras) {
    if (!extra.value) {
      continue;
    }

    const key = `${normalizeLabel(extra.label)}::${extra.value.toLowerCase()}`;

    if (seenExtraKeys.has(key)) {
      continue;
    }

    seenExtraKeys.add(key);
    uniqueExtras.push(extra);
  }

  return {
    meaning,
    example,
    usageContext,
    note,
    synonym,
    antonym,
    singularForm,
    pluralForm,
    v2Form,
    v3Form,
    extras: uniqueExtras,
  };
}

function DetailBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-3 grid grid-cols-[130px_minmax(0,1fr)] items-start gap-3">
      <div className="rounded-xl border border-primary/25 bg-secondary/25 px-3 py-2">
        <span className="inline-flex text-xs font-semibold uppercase tracking-wide text-primary-dark">{label}</span>
      </div>
      <div className="pt-1 text-sm text-text-muted">{children}</div>
    </div>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderWithHighlight(text: string, keyword: string) {
  const cleanText = text.trim();
  const cleanKeyword = keyword.trim();

  if (!cleanText || !cleanKeyword) {
    return cleanText;
  }

  const regex = new RegExp(`(${escapeRegExp(cleanKeyword)})`, 'gi');
  const parts = cleanText.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === cleanKeyword.toLowerCase()) {
      return (
        <mark key={`${part}-${index}`} className="rounded bg-primary/20 px-1 font-semibold text-primary-dark">
          {part}
        </mark>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function splitRelationTerms(value: string): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const term of value.split(/[,\n;|/]+/)) {
    const trimmed = term.trim();
    const key = normalizeVocabularyWord(trimmed);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    terms.push(trimmed);
  }

  return terms;
}

function RelationChips({
  text,
  vocabularyByWord,
  onOpenVocabularyItem,
}: {
  text: string;
  vocabularyByWord?: Map<string, VocabularyItem>;
  onOpenVocabularyItem?: (targetId: string) => void;
}) {
  const terms = splitRelationTerms(text);

  if (terms.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((term) => {
        const linkedItem = vocabularyByWord?.get(normalizeVocabularyWord(term));

        if (linkedItem && onOpenVocabularyItem) {
          return (
            <button
              key={term}
              type="button"
              onClick={() => onOpenVocabularyItem(linkedItem.id)}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-dark transition-colors hover:border-primary/50 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              title={`Mở nhanh ${linkedItem.word}`}
            >
              <span className="truncate">{term}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </button>
          );
        }

        return (
          <span
            key={term}
            className="inline-flex max-w-full rounded-full border border-muted bg-muted/40 px-2.5 py-1 text-xs font-semibold text-text-muted"
          >
            <span className="truncate">{term}</span>
          </span>
        );
      })}
    </div>
  );
}

export function VocabularyList({
  vocabulary,
  manageBasePath = '/vocabulary/manage',
  pronunciationSettings = defaultPronunciationSettings,
  vocabularyByWord,
  onOpenVocabularyItem,
  highlightedVocabularyId,
}: VocabularyListProps) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [activeVariantByCard, setActiveVariantByCard] = useState<Record<string, string>>({});
  const [visibleHighlightId, setVisibleHighlightId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightedVocabularyId) {
      return;
    }

    setVisibleHighlightId(highlightedVocabularyId);

    const frameId = window.requestAnimationFrame(() => {
      cardRefs.current[highlightedVocabularyId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });

    const timeoutId = window.setTimeout(() => {
      setVisibleHighlightId((current) => (current === highlightedVocabularyId ? null : current));
    }, 2200);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [highlightedVocabularyId]);

  const speakWord = (item: VocabularyItem, wordOverride?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(wordOverride || item.word);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = getPreferredVoice(voices, pronunciationSettings.accent);

    utterance.lang = pronunciationSettings.accent;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    }

    utterance.onstart = () => setSpeakingId(item.id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  if (vocabulary.length === 0) {
    return (
      <Card className="border-dashed bg-secondary/20">
        <CardContent className="py-12 text-center">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-text-main">Chưa có từ vựng nào</h3>
          <p className="mt-1 text-sm text-text-muted">Nhấn Thêm từ để mở form quản lý và tạo từ đầu tiên.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {vocabulary.map((item) => {
        const extracted = extractVocabularyFamilyMeta(item.notes);
        const parsed = parseNotes(extracted.plainNotes);

        const baseVariant: WordFamilyVariant = {
          word: item.word,
          pronunciation: item.pronunciation || '',
          grammar: item.grammar || '',
          relation: 'core',
          meaning: item.meaning || parsed.meaning,
          example: item.example || parsed.example,
          usageContext: item.usageContext || parsed.usageContext,
          note: item.note || parsed.note,
        };

        const familyVariantMap = new Map<string, WordFamilyVariant>();

        const pushVariant = (variant: WordFamilyVariant) => {
          const key = normalizeVocabularyWord(variant.word);

          if (!key) {
            return;
          }

          if (!familyVariantMap.has(key)) {
            familyVariantMap.set(key, variant);
            return;
          }

          const existing = familyVariantMap.get(key)!;
          familyVariantMap.set(key, {
            ...existing,
            pronunciation: existing.pronunciation || variant.pronunciation,
            grammar: existing.grammar || variant.grammar,
            relation: existing.relation || variant.relation,
            meaning: existing.meaning || variant.meaning,
            example: existing.example || variant.example,
            usageContext: existing.usageContext || variant.usageContext,
            note: existing.note || variant.note,
          });
        };

        pushVariant(baseVariant);

        if (extracted.meta) {
          for (const member of extracted.meta.members) {
            pushVariant({
              word: member.word,
              pronunciation: '',
              grammar: member.grammar || '',
              relation: member.relation || member.grammar || 'related',
              meaning: member.meaning || '',
              example: member.example || '',
              usageContext: member.usageContext || '',
              note: member.note || '',
            });
          }
        }

        const familyVariants = [...familyVariantMap.values()];
        const activeVariantKey = normalizeVocabularyWord(activeVariantByCard[item.id] || '');
        const activeVariant = familyVariants.find((variant) => normalizeVocabularyWord(variant.word) === activeVariantKey);
        const selectedVariant = activeVariant || baseVariant;

        const displayWord = selectedVariant.word || item.word;
        const displayPronunciation = selectedVariant.pronunciation || item.pronunciation || '';
        const displayGrammar = selectedVariant.grammar || item.grammar || 'Từ vựng';

        const meaning = selectedVariant.meaning || item.meaning || parsed.meaning;
        const example = selectedVariant.example || item.example || parsed.example;
        const usageContext = selectedVariant.usageContext || item.usageContext || parsed.usageContext;
        const note = selectedVariant.note || item.note || parsed.note;
        const synonym = item.synonym || parsed.synonym;
        const antonym = item.antonym || parsed.antonym;
        const singularForm = item.singularForm || parsed.singularForm;
        const pluralForm = item.pluralForm || parsed.pluralForm;
        const v2Form = item.v2Form || parsed.v2Form;
        const v3Form = item.v3Form || parsed.v3Form;

        return (
          <Card
            key={item.id}
            ref={(node) => {
              cardRefs.current[item.id] = node;
            }}
            className={`flex flex-col overflow-hidden border-primary/15 shadow-sm transition-all hover:shadow-md ${
              visibleHighlightId === item.id ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background' : ''
            }`}
          >
            {item.image ? (
              <div className="h-56 w-full bg-secondary/30 p-3 md:h-60">
                <img
                  src={item.image}
                  alt={`Minh họa cho từ ${item.word}`}
                  loading="lazy"
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>
            ) : null}

            <CardContent className="flex flex-grow flex-col p-6">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-headline text-xl font-bold text-text-main">{displayWord}</h3>
                  {displayPronunciation ? <p className="text-sm text-text-muted">{displayPronunciation}</p> : null}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => speakWord(item, displayWord)}
                    title={`Phát âm (${pronunciationSettings.accent === 'en-GB' ? 'Anh-Anh' : 'Anh-Mỹ'})`}
                  >
                    <Volume2 className={`h-5 w-5 ${speakingId === item.id ? 'text-primary' : ''}`} />
                    <span className="sr-only">Phát âm</span>
                  </Button>
                  <Button asChild type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Link href={`${manageBasePath}?id=${item.id}`}>
                      <Pencil className="h-5 w-5" />
                      <span className="sr-only">Sửa từ vựng</span>
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{displayGrammar}</Badge>
                <Badge variant="outline">{item.category || 'Tổng quát'}</Badge>
                {familyVariants.length > 1 ? <Badge variant="outline">{familyVariants.length} biến thể</Badge> : null}
                {selectedVariant.relation && selectedVariant.relation !== 'core' ? (
                  <Badge variant="outline">{selectedVariant.relation}</Badge>
                ) : null}
              </div>

              {familyVariants.length > 1 ? (
                <div className="mb-1 flex flex-wrap gap-2">
                  {familyVariants.map((variant) => {
                    const variantKey = normalizeVocabularyWord(variant.word);
                    const isActive = normalizeVocabularyWord(selectedVariant.word) === variantKey;

                    return (
                      <button
                        key={`${item.id}-${variant.word}`}
                        type="button"
                        onClick={() =>
                          setActiveVariantByCard((prev) => ({
                            ...prev,
                            [item.id]: variant.word,
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'border-transparent bg-primary-dark text-white'
                            : 'border-primary/30 bg-white text-primary-dark hover:bg-primary/10'
                        }`}
                        title={variant.relation || variant.grammar || 'related form'}
                      >
                        {variant.word}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {meaning ? <DetailBox label="Nghĩa">{renderWithHighlight(meaning, displayWord)}</DetailBox> : null}

              {example ? (
                <DetailBox label="Ví dụ">
                  <span className="italic">{renderWithHighlight(example, displayWord)}</span>
                </DetailBox>
              ) : null}

              {usageContext ? <DetailBox label="Ngữ cảnh">{renderWithHighlight(usageContext, displayWord)}</DetailBox> : null}

              {synonym ? (
                <DetailBox label="Đồng nghĩa">
                  <RelationChips
                    text={synonym}
                    vocabularyByWord={vocabularyByWord}
                    onOpenVocabularyItem={onOpenVocabularyItem}
                  />
                </DetailBox>
              ) : null}

              {antonym ? (
                <DetailBox label="Trái nghĩa">
                  <RelationChips
                    text={antonym}
                    vocabularyByWord={vocabularyByWord}
                    onOpenVocabularyItem={onOpenVocabularyItem}
                  />
                </DetailBox>
              ) : null}

              {(singularForm || pluralForm) && (
                <DetailBox label="Biến thể danh từ">
                  {singularForm ? `Số ít: ${singularForm}` : ''}
                  {singularForm && pluralForm ? ' | ' : ''}
                  {pluralForm ? `Số nhiều: ${pluralForm}` : ''}
                </DetailBox>
              )}

              {(v2Form || v3Form) && (
                <DetailBox label="Biến thể động từ">
                  {v2Form ? `V2: ${v2Form}` : ''}
                  {v2Form && v3Form ? ' | ' : ''}
                  {v3Form ? `V3: ${v3Form}` : ''}
                </DetailBox>
              )}

              {note ? <DetailBox label="Ghi chú">{renderWithHighlight(note, displayWord)}</DetailBox> : null}

              {parsed.extras.map((extra, index) => (
                <DetailBox key={`${item.id}-extra-${normalizeLabel(extra.label)}-${index}`} label={extra.label || 'Thông tin thêm'}>
                  {renderWithHighlight(extra.value, displayWord)}
                </DetailBox>
              ))}

              <div className="mt-4 flex-grow" />

              <div className="flex items-center justify-end">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Bookmark className="h-5 w-5" />
                  <span className="sr-only">Lưu từ</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
