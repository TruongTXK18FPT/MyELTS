'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  LogIn,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChipFilter } from '@/components/ui/ChipFilter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type {
  EssayQuizEvaluationResult,
  GrammarEssayQuestion,
  GrammarItem,
  GrammarMCQQuestion,
} from './types';

type GrammarQuizCenterProps = {
  initialGrammar: GrammarItem[];
};

type QuizMode = 'mcq' | 'essay';
type StatusState = { type: 'success'; message: string } | null;
type ErrorModalState = { open: boolean; title: string; message: string };

const defaultErrorModalState: ErrorModalState = {
  open: false,
  title: '',
  message: '',
};

function clampQuizCount(value: number): number {
  if (Number.isNaN(value)) {
    return 10;
  }

  return Math.max(1, Math.min(30, value));
}

export function GrammarQuizCenter({ initialGrammar }: GrammarQuizCenterProps) {
  const { data: session } = useSession();
  const canUseAI = Boolean(session?.user?.id);

  const [status, setStatus] = useState<StatusState>(null);
  const [errorModal, setErrorModal] = useState<ErrorModalState>(defaultErrorModalState);

  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('Tất cả');
  const [selectedGrammarIds, setSelectedGrammarIds] = useState<string[]>(
    initialGrammar.slice(0, 3).map((item) => item.id)
  );

  const [quizMode, setQuizMode] = useState<QuizMode>('mcq');
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(10);
  const [quizLoading, setQuizLoading] = useState(false);

  const [mcqQuestions, setMcqQuestions] = useState<GrammarMCQQuestion[]>([]);
  const [essayQuestions, setEssayQuestions] = useState<GrammarEssayQuestion[]>([]);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});

  const [showMcqResult, setShowMcqResult] = useState(false);
  const [essayResult, setEssayResult] = useState<EssayQuizEvaluationResult | null>(null);
  const [essayEvaluating, setEssayEvaluating] = useState(false);

  const openQuizErrorModal = (title: string, message: string) => {
    setErrorModal({
      open: true,
      title,
      message,
    });
  };

  const grammarTypes = useMemo(() => {
    const values = Array.from(new Set(initialGrammar.map((item) => item.grammarType?.trim()).filter(Boolean))) as string[];
    return ['Tất cả', ...values.sort((a, b) => a.localeCompare(b))];
  }, [initialGrammar]);

  const filteredGrammar = useMemo(() => {
    const q = search.trim().toLowerCase();

    return initialGrammar.filter((item) => {
      const matchesType =
        activeType === 'Tất cả' || (item.grammarType || '').toLowerCase() === activeType.toLowerCase();

      if (!matchesType) {
        return false;
      }

      if (!q) {
        return true;
      }

      const blob = [item.title, item.grammarType, item.level, item.explanation, item.tags.join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return blob.includes(q);
    });
  }, [activeType, initialGrammar, search]);

  const selectedGrammarForQuiz = useMemo(() => {
    const idSet = new Set(selectedGrammarIds);
    return initialGrammar.filter((item) => idSet.has(item.id));
  }, [initialGrammar, selectedGrammarIds]);

  const mcqScore = useMemo(() => {
    if (!showMcqResult || mcqQuestions.length === 0) {
      return null;
    }

    const correctCount = mcqQuestions.reduce((acc, question) => {
      return mcqAnswers[question.id] === question.correctOption ? acc + 1 : acc;
    }, 0);

    return {
      correctCount,
      total: mcqQuestions.length,
      percent: Math.round((correctCount / mcqQuestions.length) * 100),
    };
  }, [mcqAnswers, mcqQuestions, showMcqResult]);

  const toggleGrammarSelection = (id: string) => {
    setSelectedGrammarIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  };

  const generateQuiz = async () => {
    if (!canUseAI) {
      openQuizErrorModal('Chưa đăng nhập', 'Vui lòng đăng nhập để tạo quiz ngữ pháp bằng AI.');
      return;
    }

    if (selectedGrammarForQuiz.length === 0) {
      openQuizErrorModal('Thiếu chủ điểm ngữ pháp', 'Hãy chọn ít nhất 1 chủ điểm ngữ pháp trước khi tạo quiz.');
      return;
    }

    try {
      setQuizLoading(true);
      setStatus(null);
      setShowMcqResult(false);
      setEssayResult(null);
      setMcqAnswers({});
      setEssayAnswers({});

      const response = await fetch('/api/grammar/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-quiz',
          mode: quizMode,
          questionCount: clampQuizCount(quizQuestionCount),
          grammarItems: selectedGrammarForQuiz.slice(0, 12).map((item) => ({
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
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Không thể tạo quiz ngữ pháp.');
      }

      if (payload?.quiz?.mode === 'mcq') {
        setMcqQuestions((payload.quiz.questions || []) as GrammarMCQQuestion[]);
        setEssayQuestions([]);
        setStatus({ type: 'success', message: `Đã tạo quiz trắc nghiệm ${payload.quiz.questions?.length || 0} câu.` });
      } else {
        setEssayQuestions((payload.quiz.questions || []) as GrammarEssayQuestion[]);
        setMcqQuestions([]);
        setStatus({ type: 'success', message: `Đã tạo quiz tự luận ${payload.quiz.questions?.length || 0} câu.` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      openQuizErrorModal('Lỗi tạo quiz', message);
    } finally {
      setQuizLoading(false);
    }
  };

  const submitMcqQuiz = () => {
    if (mcqQuestions.length === 0) {
      openQuizErrorModal('Chưa có quiz', 'Hãy tạo quiz trắc nghiệm trước khi chấm điểm.');
      return;
    }

    const unanswered = mcqQuestions.filter((question) => !mcqAnswers[question.id]);

    if (unanswered.length > 0) {
      openQuizErrorModal('Thiếu câu trả lời', `Bạn chưa trả lời ${unanswered.length} câu trong bài trắc nghiệm.`);
      return;
    }

    setShowMcqResult(true);
    setStatus({ type: 'success', message: 'Đã chấm xong quiz trắc nghiệm.' });
  };

  const submitEssayQuiz = async () => {
    if (!canUseAI) {
      openQuizErrorModal('Chưa đăng nhập', 'Vui lòng đăng nhập để chấm quiz tự luận bằng AI.');
      return;
    }

    if (essayQuestions.length === 0) {
      openQuizErrorModal('Chưa có quiz', 'Hãy tạo quiz tự luận trước khi nộp bài.');
      return;
    }

    const unanswered = essayQuestions.filter((question) => !(essayAnswers[question.id] || '').trim());

    if (unanswered.length > 0) {
      openQuizErrorModal('Thiếu đáp án', `Bạn chưa nhập đáp án cho ${unanswered.length} câu tự luận.`);
      return;
    }

    try {
      setEssayEvaluating(true);
      setStatus(null);

      const response = await fetch('/api/grammar/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'evaluate-essay-quiz',
          questions: essayQuestions.map((question) => ({
            id: question.id,
            grammarTitle: question.grammarTitle,
            context: question.context,
            prompt: question.prompt,
            sampleAnswer: question.sampleAnswer,
          })),
          answers: essayQuestions.map((question) => ({
            id: question.id,
            answer: essayAnswers[question.id] || '',
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Không thể chấm quiz tự luận.');
      }

      setEssayResult(payload.result as EssayQuizEvaluationResult);
      setStatus({ type: 'success', message: 'AI đã chấm xong quiz tự luận.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      openQuizErrorModal('Lỗi chấm tự luận', message);
    } finally {
      setEssayEvaluating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/grammar">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về trang Grammar
          </Link>
        </Button>
      </div>

      {!canUseAI ? (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-amber-800 md:flex-row md:items-center md:justify-between">
            <p>Đăng nhập để dùng đầy đủ tính năng tạo quiz và chấm bài tự luận bằng AI.</p>
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
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {status.message}
        </div>
      ) : null}

      <Card className="border-primary/20 bg-gradient-to-br from-white via-white to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-primary" />
            Quiz Ngữ pháp AI
          </CardTitle>
          <CardDescription>
            Chọn chủ điểm ngữ pháp muốn kiểm tra, tạo đề trắc nghiệm hoặc tự luận với tối đa 30 câu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={quizMode} onValueChange={(value) => setQuizMode(value as QuizMode)} className="w-full">
            <TabsList>
              <TabsTrigger value="mcq">Trắc nghiệm</TabsTrigger>
              <TabsTrigger value="essay">Tự luận</TabsTrigger>
            </TabsList>
            <TabsContent value="mcq" className="pt-1 text-sm text-text-muted">
              Trắc nghiệm gồm 4 lựa chọn A-B-C-D cho mỗi câu.
            </TabsContent>
            <TabsContent value="essay" className="pt-1 text-sm text-text-muted">
              Tự luận yêu cầu bạn tự viết câu hoặc đoạn ngắn đúng ngữ pháp trong ngữ cảnh AI đưa ra.
            </TabsContent>
          </Tabs>

          <div className="grid gap-4 rounded-xl border border-primary/20 bg-white p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Tìm chủ điểm dùng cho quiz..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-sm font-medium text-text-muted">Loại ngữ pháp:</span>
              {grammarTypes.map((type) => (
                <ChipFilter key={type} label={type} isActive={activeType === type} onClick={() => setActiveType(type)} />
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
              <div className="space-y-2">
                <Label htmlFor="quizCount">Số câu (1-30)</Label>
                <Input
                  id="quizCount"
                  type="number"
                  min={1}
                  max={30}
                  value={quizQuestionCount}
                  onChange={(event) => setQuizQuestionCount(clampQuizCount(Number(event.target.value)))}
                />
              </div>

              <div className="space-y-2">
                <Label>Chủ điểm ngữ pháp dùng để tạo quiz</Label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-border p-3">
                  <ChipFilter
                    label="Chọn tất cả theo bộ lọc"
                    isActive={selectedGrammarIds.length === filteredGrammar.length && filteredGrammar.length > 0}
                    onClick={() => setSelectedGrammarIds(filteredGrammar.map((item) => item.id))}
                  />
                  <ChipFilter label="Xóa chọn" isActive={selectedGrammarIds.length === 0} onClick={() => setSelectedGrammarIds([])} />
                  {filteredGrammar.map((item) => (
                    <ChipFilter
                      key={item.id}
                      label={item.title}
                      isActive={selectedGrammarIds.includes(item.id)}
                      onClick={() => toggleGrammarSelection(item.id)}
                    />
                  ))}
                </div>
                <p className="text-xs text-text-muted">
                  Đã chọn {selectedGrammarIds.length} chủ điểm. Hệ thống gửi tối đa 12 chủ điểm mỗi lần tạo quiz.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={generateQuiz} disabled={quizLoading || !canUseAI}>
                {quizLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI đang tạo quiz...
                  </>
                ) : (
                  'Tạo quiz ngay'
                )}
              </Button>
            </div>
          </div>

          {mcqQuestions.length > 0 ? (
            <div className="space-y-4 rounded-xl border border-primary/20 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-base font-semibold text-text-main">Quiz trắc nghiệm ({mcqQuestions.length} câu)</h4>
                <Button type="button" onClick={submitMcqQuiz} disabled={!canUseAI}>
                  Chấm bài trắc nghiệm
                </Button>
              </div>

              {mcqScore ? (
                <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-text-main">
                  Kết quả: {mcqScore.correctCount}/{mcqScore.total} câu đúng ({mcqScore.percent}%).
                </div>
              ) : null}

              <div className="space-y-4">
                {mcqQuestions.map((question, index) => {
                  const selected = mcqAnswers[question.id];
                  const isCorrect = selected === question.correctOption;

                  return (
                    <div key={question.id} className="rounded-lg border border-border p-4">
                      <p className="text-sm text-text-muted">Câu {index + 1} - {question.grammarTitle}</p>
                      <p className="mt-2 text-sm text-text-muted">{question.context}</p>
                      <p className="mt-3 font-medium text-text-main">{question.question}</p>

                      <div className="mt-3 grid gap-2">
                        {question.options.map((option) => (
                          <button
                            key={`${question.id}-${option.key}`}
                            type="button"
                            onClick={() => {
                              setMcqAnswers((prev) => ({
                                ...prev,
                                [question.id]: option.key,
                              }));
                              setShowMcqResult(false);
                            }}
                            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                              selected === option.key
                                ? 'border-primary bg-primary/10 text-primary-dark'
                                : 'border-border hover:bg-secondary/40'
                            }`}
                          >
                            <span className="font-semibold">{option.key}. </span>
                            <span>{option.text}</span>
                          </button>
                        ))}
                      </div>

                      {showMcqResult ? (
                        <div
                          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                            isCorrect
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : 'border-red-300 bg-red-50 text-red-700'
                          }`}
                        >
                          {isCorrect
                            ? `Đúng. Đáp án: ${question.correctOption}.`
                            : `Chưa đúng. Đáp án đúng: ${question.correctOption}.`}
                          <p className="mt-1 text-xs text-text-muted">{question.explanation}</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {essayQuestions.length > 0 ? (
            <div className="space-y-4 rounded-xl border border-primary/20 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-base font-semibold text-text-main">Quiz tự luận ({essayQuestions.length} câu)</h4>
                <Button type="button" onClick={submitEssayQuiz} disabled={essayEvaluating || !canUseAI}>
                  {essayEvaluating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI đang chấm...
                    </>
                  ) : (
                    'Nộp bài và chấm AI'
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                {essayQuestions.map((question, index) => {
                  const result = essayResult?.items.find((entry) => entry.id === question.id);

                  return (
                    <div key={question.id} className="rounded-lg border border-border p-4">
                      <p className="text-sm text-text-muted">Câu {index + 1} - {question.grammarTitle}</p>
                      <p className="mt-2 text-sm text-text-muted">{question.context}</p>
                      <p className="mt-3 font-medium text-text-main">{question.prompt}</p>

                      <Textarea
                        rows={4}
                        value={essayAnswers[question.id] || ''}
                        onChange={(event) =>
                          setEssayAnswers((prev) => ({
                            ...prev,
                            [question.id]: event.target.value,
                          }))
                        }
                        placeholder="Nhập câu trả lời của bạn..."
                        className="mt-3"
                      />

                      <p className="mt-2 text-xs text-text-muted">Gợi ý chấm: {question.scoringGuide}</p>

                      {result ? (
                        <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm">
                          <p className="font-semibold text-text-main">
                            Điểm: {result.score}/{result.maxScore}
                          </p>
                          <p className="mt-1 text-text-muted">{result.feedback}</p>
                          <p className="mt-2 text-xs text-text-muted">Câu gợi ý tốt hơn: {result.modelSuggestion}</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {essayResult ? (
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm">
                  <p className="font-semibold text-text-main">
                    Tổng điểm: {essayResult.totalScore}/{essayResult.maxScore}
                  </p>
                  <p className="mt-1 text-text-muted">{essayResult.overallFeedback}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog open={errorModal.open} onOpenChange={(open) => setErrorModal((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {errorModal.title || 'Có lỗi xảy ra'}
            </AlertDialogTitle>
            <AlertDialogDescription>{errorModal.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorModal(defaultErrorModalState)}>Đã hiểu</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
