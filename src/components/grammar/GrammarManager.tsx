'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Brain,
  BookCheck,
  CircleHelp,
  Loader2,
  LogIn,
  Pencil,
  PlusCircle,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChipFilter } from '@/components/ui/ChipFilter';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GrammarFormulaTable } from './GrammarFormulaTable';
import type { GrammarItem, GrammarTrainingDrill, TrainingEvaluationResult } from './types';

type GrammarManagerProps = {
  initialGrammar: GrammarItem[];
};

type SortMode = 'newest' | 'oldest' | 'a-z' | 'z-a';
type StatusState = { type: 'success' | 'error'; message: string } | null;

const sortOptions: { label: string; value: SortMode }[] = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'A-Z', value: 'a-z' },
  { label: 'Z-A', value: 'z-a' },
];

const ITEMS_PER_PAGE = 4;

export function GrammarManager({ initialGrammar }: GrammarManagerProps) {
  const { data: session } = useSession();
  const canUseAI = Boolean(session?.user?.id);

  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('Tất cả');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const [activeTrainingId, setActiveTrainingId] = useState<string | null>(null);
  const [trainingDrill, setTrainingDrill] = useState<GrammarTrainingDrill | null>(null);
  const [trainingAnswers, setTrainingAnswers] = useState<Record<string, string>>({});
  const [trainingResults, setTrainingResults] = useState<Record<string, TrainingEvaluationResult>>({});
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [evaluatingExerciseId, setEvaluatingExerciseId] = useState<string | null>(null);

  const [status, setStatus] = useState<StatusState>(null);

  const grammarTypes = useMemo(() => {
    const values = Array.from(new Set(initialGrammar.map((item) => item.grammarType?.trim()).filter(Boolean))) as string[];
    return ['Tất cả', ...values.sort((a, b) => a.localeCompare(b))];
  }, [initialGrammar]);

  const filteredGrammar = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = initialGrammar.filter((item) => {
      const matchesType =
        activeType === 'Tất cả' || (item.grammarType || '').toLowerCase() === activeType.toLowerCase();

      if (!matchesType) {
        return false;
      }

      if (!q) {
        return true;
      }

      const blob = [
        item.title,
        item.grammarType,
        item.level,
        item.explanation,
        item.usageGuide,
        item.structurePattern,
        item.exampleSentence,
        item.storyExample,
        item.practiceHint,
        item.tags.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return blob.includes(q);
    });

    return filtered.sort((a, b) => {
      if (sortMode === 'a-z') {
        return a.title.localeCompare(b.title);
      }

      if (sortMode === 'z-a') {
        return b.title.localeCompare(a.title);
      }

      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sortMode === 'oldest') {
        return dateA - dateB;
      }

      return dateB - dateA;
    });
  }, [activeType, initialGrammar, search, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredGrammar.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeType, sortMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * ITEMS_PER_PAGE;
  const paginatedGrammar = filteredGrammar.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const activeTrainingGrammar = useMemo(
    () => (activeTrainingId ? initialGrammar.find((item) => item.id === activeTrainingId) || null : null),
    [activeTrainingId, initialGrammar]
  );

  const startTraining = async (item: GrammarItem) => {
    setActiveTrainingId(item.id);
    setTrainingDrill(null);
    setTrainingAnswers({});
    setTrainingResults({});

    if (!canUseAI) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để tạo bài luyện ngữ pháp với AI.' });
      return;
    }

    try {
      setTrainingLoading(true);
      setStatus(null);

      const response = await fetch('/api/grammar/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-training',
          grammar: {
            id: item.id,
            title: item.title,
            grammarType: item.grammarType || '',
            level: item.level || '',
            explanation: item.explanation,
            usageGuide: item.usageGuide || '',
            structurePattern: item.structurePattern || '',
            exampleSentence: item.exampleSentence || '',
            storyExample: item.storyExample || '',
            practiceHint: item.practiceHint || '',
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Không thể tạo bài luyện AI.');
      }

      setTrainingDrill(payload.drill as GrammarTrainingDrill);
      setStatus({ type: 'success', message: `Đã tạo bài luyện cho chủ điểm "${item.title}".` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setTrainingLoading(false);
    }
  };

  const evaluateExercise = async (exerciseId: string, prompt: string) => {
    if (!activeTrainingGrammar) {
      return;
    }

    if (!canUseAI) {
      setStatus({ type: 'error', message: 'Bạn cần đăng nhập để chấm bài luyện bằng AI.' });
      return;
    }

    const answer = (trainingAnswers[exerciseId] || '').trim();

    if (!answer) {
      setStatus({ type: 'error', message: 'Hãy nhập câu trả lời trước khi chấm.' });
      return;
    }

    try {
      setEvaluatingExerciseId(exerciseId);
      setStatus(null);

      const response = await fetch('/api/grammar/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'evaluate-training',
          grammarTitle: activeTrainingGrammar.title,
          exercisePrompt: prompt,
          learnerAnswer: answer,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Không thể chấm bài luyện.');
      }

      setTrainingResults((prev) => ({
        ...prev,
        [exerciseId]: payload as TrainingEvaluationResult,
      }));

      setStatus({ type: 'success', message: 'AI đã chấm và phản hồi cho bài luyện này.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setEvaluatingExerciseId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-text-muted">
          Kho ngữ pháp hiện có {initialGrammar.length} chủ điểm. Trang này chỉ hiển thị 4 chủ điểm mỗi trang để dễ học.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/grammar/quiz">
              <Target className="mr-2 h-4 w-4" />
              Mở Grammar Quiz
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/grammar/mindmap">
              <Brain className="mr-2 h-4 w-4" />
              Mở Mindmap
            </Link>
          </Button>
          <Button asChild>
            <Link href="/grammar/manage">
              <PlusCircle className="mr-2 h-4 w-4" />
              Quản lý ngữ pháp
            </Link>
          </Button>
        </div>
      </div>

      {!canUseAI ? (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-amber-800 md:flex-row md:items-center md:justify-between">
            <p>Đăng nhập để dùng AI training và chấm bài luyện ngay tại từng chủ điểm.</p>
            <Button asChild variant="outline" className="border-amber-400 bg-white">
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" />
                Đăng nhập
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {status ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-red-300 bg-red-50 text-red-700'
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">Bộ lọc chủ điểm ngữ pháp</CardTitle>
          <CardDescription>Tìm nhanh chủ điểm theo loại ngữ pháp, cấp độ và từ khóa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tiêu đề, cách dùng, cấu trúc, ví dụ..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-medium text-text-muted">Loại ngữ pháp:</span>
            {grammarTypes.map((type) => (
              <ChipFilter key={type} label={type} isActive={activeType === type} onClick={() => setActiveType(type)} />
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {paginatedGrammar.map((item) => (
          <Card key={item.id} className="border-primary/20 bg-gradient-to-br from-white via-white to-primary/5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl text-text-main">{item.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.grammarType || 'General'}{item.level ? ` • ${item.level}` : ''}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => startTraining(item)}>
                    <BookCheck className="mr-1 h-4 w-4" />
                    Luyện AI
                  </Button>
                  <Button asChild type="button" variant="ghost" size="icon">
                    <Link href={`/grammar/manage?id=${item.id}`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Sửa ngữ pháp</span>
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {item.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="secondary" className="border border-primary/20 bg-primary/5 text-primary-dark">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-muted">
              <div className="rounded-xl border border-primary/20 bg-secondary/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Highlight</p>
                <p className="mt-2 leading-relaxed text-text-main">{item.explanation}</p>
              </div>

              <GrammarFormulaTable structurePattern={item.structurePattern} />

              {item.usageGuide ? (
                <div className="rounded-xl border border-primary/15 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Cách dùng chiến lược</p>
                  <p className="mt-2 leading-relaxed">{item.usageGuide}</p>
                </div>
              ) : null}

              {(item.exampleSentence || item.storyExample) ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {item.exampleSentence ? (
                    <div className="rounded-xl border border-primary/15 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Ví dụ mẫu</p>
                      <p className="mt-2 text-text-main">{item.exampleSentence}</p>
                    </div>
                  ) : null}

                  {item.storyExample ? (
                    <div className="rounded-xl border border-primary/15 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Ngữ cảnh câu chuyện</p>
                      <p className="mt-2">{item.storyExample}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {item.practiceHint ? (
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Bài tập gợi ý</p>
                  <p className="mt-2">{item.practiceHint}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGrammar.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-secondary/20 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-text-muted">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredGrammar.length)} trên {filteredGrammar.length}{' '}
            chủ điểm
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

      {filteredGrammar.length === 0 ? (
        <Card className="border-dashed bg-secondary/20">
          <CardContent className="py-10 text-center">
            <CircleHelp className="mx-auto mb-3 h-6 w-6 text-primary" />
            <p className="text-text-main">Không tìm thấy chủ điểm phù hợp với bộ lọc hiện tại.</p>
          </CardContent>
        </Card>
      ) : null}

      {activeTrainingGrammar ? (
        <Card className="border-primary/20 bg-gradient-to-br from-white via-white to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Training theo chủ điểm: {activeTrainingGrammar.title}
            </CardTitle>
            <CardDescription>
              Tạo ngữ cảnh luyện tập, nhập câu trả lời và nhận phản hồi AI ngay trong từng bài tập.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trainingLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-3 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI đang tạo bộ bài luyện cho bạn...
              </div>
            ) : null}

            {!trainingLoading && !trainingDrill ? (
              <div className="rounded-lg border border-dashed border-primary/25 bg-white p-4 text-sm text-text-muted">
                Chưa có bộ luyện tập. Hãy bấm nút Luyện AI ở thẻ ngữ pháp để tạo lại nội dung.
              </div>
            ) : null}

            {trainingDrill ? (
              <>
                <div className="rounded-lg border border-primary/20 bg-white p-4 text-sm text-text-muted">
                  <p className="font-medium text-text-main">Tóm tắt mục tiêu</p>
                  <p className="mt-1">{trainingDrill.summary}</p>
                  <p className="mt-3 font-medium text-text-main">Ngữ cảnh luyện</p>
                  <p className="mt-1">{trainingDrill.contextScenario}</p>
                </div>

                <div className="space-y-4">
                  {trainingDrill.exercises.map((exercise, index) => {
                    const result = trainingResults[exercise.id];

                    return (
                      <div key={exercise.id} className="rounded-lg border border-border bg-white p-4">
                        <p className="text-sm text-text-muted">Bài {index + 1} - {exercise.focus}</p>
                        <p className="mt-2 font-medium text-text-main">{exercise.prompt}</p>

                        <Textarea
                          rows={3}
                          value={trainingAnswers[exercise.id] || ''}
                          onChange={(event) =>
                            setTrainingAnswers((prev) => ({
                              ...prev,
                              [exercise.id]: event.target.value,
                            }))
                          }
                          placeholder="Nhập câu trả lời của bạn..."
                          className="mt-3"
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => evaluateExercise(exercise.id, exercise.prompt)}
                            disabled={evaluatingExerciseId === exercise.id || !canUseAI}
                          >
                            {evaluatingExerciseId === exercise.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang chấm...
                              </>
                            ) : (
                              'Chấm bằng AI'
                            )}
                          </Button>
                        </div>

                        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-text-muted">
                          <p className="font-semibold text-text-main">Gợi ý câu mẫu</p>
                          <p className="mt-1">{exercise.sampleAnswer}</p>
                          <p className="mt-2">Mẹo: {exercise.tips}</p>
                        </div>

                        {result ? (
                          <div className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
                            <p className="font-semibold">
                              Điểm: {result.score}/{result.maxScore}
                            </p>
                            <p className="mt-1">{result.feedback}</p>
                            <p className="mt-2 text-green-800">Câu cải thiện: {result.improvedAnswer}</p>
                            {result.mistakes.length > 0 ? (
                              <ul className="mt-2 list-inside list-disc text-xs text-green-900">
                                {result.mistakes.map((mistake) => (
                                  <li key={`${exercise.id}-${mistake}`}>{mistake}</li>
                                ))}
                              </ul>
                            ) : null}
                            <p className="mt-2 text-xs">Bước tiếp theo: {result.nextStep}</p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
