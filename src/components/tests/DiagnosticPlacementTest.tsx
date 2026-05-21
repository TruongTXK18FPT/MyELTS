'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  FileAudio,
  Loader2,
  PenLine,
  Trophy,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  countWords,
  placementSkillLabels,
  type DiagnosticSurvey,
  type PlacementResult,
  type PlacementSkillKey,
  type PublicGeneratedDiagnosticTest,
} from '@/lib/diagnostic-placement-test';

type Step = 'survey' | 'reading' | 'writing' | 'result';

type GeneratedAttempt = {
  id: string;
  createdAt: string;
  survey: DiagnosticSurvey;
  test: PublicGeneratedDiagnosticTest;
  provider?: string | null;
  modelUsed?: string | null;
};

type DiagnosticReview = {
  provider?: string;
  modelUsed?: string | null;
  writing?: {
    task1Band: number;
    task2Band: number;
    criteria: {
      taskAchievement: number;
      coherenceCohesion: number;
      lexicalResource: number;
      grammarRangeAccuracy: number;
    };
    weakestCriteria: string[];
    summary: string;
    task1Feedback: string;
    task2Feedback: string;
    priorityDrills: string[];
  };
  reading?: {
    weakQuestionTypes?: string[];
  };
  surveyOnlySkills?: string[];
};

const skillOrder: PlacementSkillKey[] = ['reading', 'writing', 'listening', 'speaking'];

const initialSurveyForm = {
  currentOverallBand: '5.5',
  targetOverallBand: '7.0',
  targetDate: '',
  weeklyStudyHours: '8',
  skillBands: {
    listening: '5.5',
    reading: '5.5',
    writing: '5.5',
    speaking: '5.5',
  },
  targetSkillBands: {
    listening: '7.0',
    reading: '7.0',
    writing: '7.0',
    speaking: '7.0',
  },
  preferences: {
    readingTopics: 'education, technology, environment',
    writingTask1Comfort: 'line graphs and bar charts',
    writingTask2Interests: 'education, work, cities, technology',
    listeningAudioInterests: 'academic lectures and everyday conversations',
    speakingTopics: 'work, study, hobbies, travel',
  },
};

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildSurveyPayload(form: typeof initialSurveyForm): DiagnosticSurvey {
  return {
    currentOverallBand: toNumber(form.currentOverallBand),
    targetOverallBand: toNumber(form.targetOverallBand),
    targetDate: form.targetDate.trim() || null,
    weeklyStudyHours: Math.round(toNumber(form.weeklyStudyHours)),
    skillBands: {
      listening: toNumber(form.skillBands.listening),
      reading: toNumber(form.skillBands.reading),
      writing: toNumber(form.skillBands.writing),
      speaking: toNumber(form.skillBands.speaking),
    },
    targetSkillBands: {
      listening: toNumber(form.targetSkillBands.listening),
      reading: toNumber(form.targetSkillBands.reading),
      writing: toNumber(form.targetSkillBands.writing),
      speaking: toNumber(form.targetSkillBands.speaking),
    },
    preferences: {
      readingTopics: form.preferences.readingTopics.trim(),
      writingTask1Comfort: form.preferences.writingTask1Comfort.trim(),
      writingTask2Interests: form.preferences.writingTask2Interests.trim(),
      listeningAudioInterests: form.preferences.listeningAudioInterests.trim(),
      speakingTopics: form.preferences.speakingTopics.trim(),
    },
  };
}

function sectionProgress(step: Step, attempt: GeneratedAttempt | null, answers: Record<string, string>, writing: { task1: string; task2: string }) {
  if (step === 'survey') {
    return attempt ? 25 : 10;
  }

  if (step === 'reading' && attempt) {
    return 25 + (Object.keys(answers).length / attempt.test.reading.questions.length) * 35;
  }

  if (step === 'writing') {
    const completed = (writing.task1.trim() ? 1 : 0) + (writing.task2.trim() ? 1 : 0);
    return 60 + completed * 15;
  }

  return 100;
}

export function DiagnosticPlacementTest() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('survey');
  const [surveyForm, setSurveyForm] = useState(initialSurveyForm);
  const [attempt, setAttempt] = useState<GeneratedAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writing, setWriting] = useState({ task1: '', task2: '' });
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [review, setReview] = useState<DiagnosticReview | null>(null);
  const [savedDiagnosticMeta, setSavedDiagnosticMeta] = useState<{ takenAt: string; expiresAt: string } | null>(null);
  const [isLoadingAttempt, setIsLoadingAttempt] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSourceNote, setAudioSourceNote] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const loadCurrentAttempt = useCallback(async () => {
    setIsLoadingAttempt(true);

    try {
      const response = await fetch('/api/tests/diagnostic/attempt/current', { cache: 'no-store' });
      const data = (await response.json()) as { attempt?: GeneratedAttempt | null; error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Cannot load current diagnostic attempt.');
      }

      if (data.attempt) {
        setAttempt(data.attempt);
        setSurveyForm({
          ...initialSurveyForm,
          ...data.attempt.survey,
          skillBands: {
            ...initialSurveyForm.skillBands,
            ...Object.fromEntries(
              Object.entries(data.attempt.survey.skillBands).map(([key, value]) => [key, Number(value).toFixed(1)])
            ),
          } as typeof initialSurveyForm.skillBands,
          targetSkillBands: {
            ...initialSurveyForm.targetSkillBands,
            ...Object.fromEntries(
              Object.entries(data.attempt.survey.targetSkillBands).map(([key, value]) => [key, Number(value).toFixed(1)])
            ),
          } as typeof initialSurveyForm.targetSkillBands,
          currentOverallBand: Number(data.attempt.survey.currentOverallBand).toFixed(1),
          targetOverallBand: Number(data.attempt.survey.targetOverallBand).toFixed(1),
          weeklyStudyHours: String(data.attempt.survey.weeklyStudyHours),
          targetDate: data.attempt.survey.targetDate || '',
        });
        setStep('reading');
      }
    } catch (error) {
      toast({
        title: 'Cannot load diagnostic attempt',
        description: error instanceof Error ? error.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAttempt(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadCurrentAttempt();
  }, [loadCurrentAttempt]);

  const progress = sectionProgress(step, attempt, answers, writing);
  const canSubmitReading = attempt ? attempt.test.reading.questions.every((question) => answers[question.id]) : false;
  const canSubmitWriting = countWords(writing.task1) >= 80 && countWords(writing.task2) >= 120;

  const groupedReadingQuestions = useMemo(() => {
    if (!attempt) {
      return [];
    }

    const groups = new Map<string, typeof attempt.test.reading.questions>();
    for (const question of attempt.test.reading.questions) {
      const current = groups.get(question.type) || [];
      current.push(question);
      groups.set(question.type, current);
    }

    return [...groups.entries()];
  }, [attempt]);

  const updateSkillBand = (kind: 'skillBands' | 'targetSkillBands', skill: PlacementSkillKey, value: string) => {
    setSurveyForm((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        [skill]: value,
      },
    }));
  };

  const updatePreference = (key: keyof typeof initialSurveyForm.preferences, value: string) => {
    setSurveyForm((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const survey = buildSurveyPayload(surveyForm);
      const response = await fetch('/api/tests/diagnostic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey }),
      });
      const data = (await response.json()) as { attempt?: GeneratedAttempt; error?: string };

      if (!response.ok || !data.attempt) {
        throw new Error(data.error || 'Cannot generate diagnostic test.');
      }

      setAttempt(data.attempt);
      setAnswers({});
      setWriting({ task1: '', task2: '' });
      setResult(null);
      setReview(null);
      setSavedDiagnosticMeta(null);
      setStep('reading');
      toast({
        title: 'Diagnostic generated',
        description: 'Reading and Writing test has been personalized from your survey.',
      });
    } catch (error) {
      toast({
        title: 'Cannot generate diagnostic',
        description: error instanceof Error ? error.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!attempt || !canSubmitReading || !canSubmitWriting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tests/diagnostic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          readingAnswers: answers,
          writing,
        }),
      });
      const data = (await response.json()) as {
        diagnostic?: { takenAt: string; expiresAt: string };
        result?: PlacementResult;
        review?: DiagnosticReview;
        error?: string;
      };

      if (!response.ok || !data.result) {
        throw new Error(data.error || 'Cannot submit diagnostic.');
      }

      setResult(data.result);
      setReview(data.review || null);
      setSavedDiagnosticMeta(data.diagnostic || null);
      setStep('result');
      toast({
        title: 'Diagnostic submitted',
        description: 'Roadmap can now use your Reading and Writing evidence.',
      });
    } catch (error) {
      toast({
        title: 'Diagnostic submit failed',
        description: error instanceof Error ? error.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadAudio = async () => {
    if (!audioFile || !attempt) {
      return;
    }

    setIsUploadingAudio(true);

    try {
      const formData = new FormData();
      formData.set('file', audioFile);
      formData.set('attemptId', attempt.id);
      formData.set('sourceNote', audioSourceNote.trim());

      const response = await fetch('/api/tests/listening/audio/upload', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json()) as { asset?: { id: string }; error?: string };

      if (!response.ok || !data.asset) {
        throw new Error(data.error || 'Cannot upload listening audio.');
      }

      setAudioFile(null);
      setAudioSourceNote('');
      toast({
        title: 'Audio uploaded',
        description: 'The file is saved for the future Listening pipeline. It is not scored yet.',
      });
    } catch (error) {
      toast({
        title: 'Audio upload failed',
        description: error instanceof Error ? error.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  if (isLoadingAttempt) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 p-10 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading diagnostic workspace...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ClipboardList className="h-6 w-6 text-primary-dark" />
            AI Diagnostic Placement
          </CardTitle>
          <CardDescription>
            Survey first, then an AI-generated IELTS Academic Reading and Writing diagnostic. Listening and Speaking are recorded as survey-only for V1.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col justify-between gap-2 text-sm text-text-muted md:flex-row md:items-center">
            <span>Step: {step === 'survey' ? 'Survey' : step === 'reading' ? 'Reading' : step === 'writing' ? 'Writing' : 'Result'}</span>
            <span>{attempt ? `Attempt ${attempt.id.slice(0, 8)}` : 'Academic V1'}</span>
          </div>
          <ProgressBar value={progress} />
        </CardContent>
      </Card>

      {step === 'survey' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Learner Survey</CardTitle>
            <CardDescription>
              These answers guide the AI test difficulty and topic selection. V1 uses IELTS Academic only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                label="Current overall band"
                value={surveyForm.currentOverallBand}
                onChange={(event) => setSurveyForm((prev) => ({ ...prev, currentOverallBand: event.target.value }))}
              />
              <Input
                type="number"
                step="0.5"
                min="4"
                max="9"
                label="Target overall band"
                value={surveyForm.targetOverallBand}
                onChange={(event) => setSurveyForm((prev) => ({ ...prev, targetOverallBand: event.target.value }))}
              />
              <Input
                type="number"
                min="1"
                max="60"
                label="Weekly study hours"
                value={surveyForm.weeklyStudyHours}
                onChange={(event) => setSurveyForm((prev) => ({ ...prev, weeklyStudyHours: event.target.value }))}
              />
              <Input
                type="date"
                label="Target date"
                value={surveyForm.targetDate}
                onChange={(event) => setSurveyForm((prev) => ({ ...prev, targetDate: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {skillOrder.map((skill) => (
                <div key={skill} className="rounded-xl border border-secondary p-4">
                  <p className="mb-3 font-medium text-text-main">{placementSkillLabels[skill]}</p>
                  <div className="space-y-3">
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      label="Current"
                      value={surveyForm.skillBands[skill]}
                      onChange={(event) => updateSkillBand('skillBands', skill, event.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.5"
                      min="4"
                      max="9"
                      label="Target"
                      value={surveyForm.targetSkillBands[skill]}
                      onChange={(event) => updateSkillBand('targetSkillBands', skill, event.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reading topics</Label>
                <Textarea
                  value={surveyForm.preferences.readingTopics}
                  onChange={(event) => updatePreference('readingTopics', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Writing Task 1 comfort</Label>
                <Textarea
                  value={surveyForm.preferences.writingTask1Comfort}
                  onChange={(event) => updatePreference('writingTask1Comfort', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Writing Task 2 interests</Label>
                <Textarea
                  value={surveyForm.preferences.writingTask2Interests}
                  onChange={(event) => updatePreference('writingTask2Interests', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Listening and Speaking interests</Label>
                <Textarea
                  value={`${surveyForm.preferences.listeningAudioInterests}\n${surveyForm.preferences.speakingTopics}`}
                  onChange={(event) => {
                    const [listening = '', speaking = ''] = event.target.value.split('\n');
                    updatePreference('listeningAudioInterests', listening);
                    updatePreference('speakingTopics', speaking || listening);
                  }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleGenerate} disabled={isGenerating} className="rounded-full px-8">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate AI diagnostic'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {attempt && step === 'reading' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-primary-dark" />
                Reading: {attempt.test.reading.title}
              </CardTitle>
              <CardDescription>
                Answer all questions. The answer key is stored server-side and will not be shown before submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-secondary bg-secondary/20 p-4">
                <p className="whitespace-pre-line text-sm leading-7 text-text-main">{attempt.test.reading.passage}</p>
              </div>

              {groupedReadingQuestions.map(([type, questions]) => (
                <div key={type} className="space-y-4">
                  <h3 className="text-lg font-semibold text-text-main">{type.replaceAll('_', ' ')}</h3>
                  {questions.map((question, index) => (
                    <div key={question.id} className="space-y-3 rounded-xl border border-secondary p-4">
                      <p className="font-medium text-text-main">
                        {question.id}. {question.prompt}
                      </p>
                      {question.skillFocus && <p className="text-xs text-text-muted">Focus: {question.skillFocus}</p>}
                      <RadioGroup
                        value={answers[question.id] || ''}
                        onValueChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
                        className="space-y-3"
                      >
                        {question.options.map((option) => {
                          const optionId = `${question.id}-${option.id}-${index}`;

                          return (
                            <div key={option.id} className="flex items-start gap-3 rounded-lg border border-secondary/70 p-3">
                              <RadioGroupItem id={optionId} value={option.id} />
                              <Label htmlFor={optionId} className="cursor-pointer text-sm leading-6 text-text-main">
                                <span className="font-semibold">{option.id}.</span> {option.text}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 md:flex-row md:justify-between">
              <p className="text-sm text-text-muted">
                Answered {Object.keys(answers).length}/{attempt.test.reading.questions.length}
              </p>
              <Button onClick={() => setStep('writing')} disabled={!canSubmitReading} className="rounded-full px-8">
                Continue to Writing
              </Button>
            </CardFooter>
          </Card>

          <ListeningUploadPanel
            audioFile={audioFile}
            audioSourceNote={audioSourceNote}
            isUploadingAudio={isUploadingAudio}
            onFileChange={setAudioFile}
            onNoteChange={setAudioSourceNote}
            onUpload={handleUploadAudio}
          />
        </div>
      )}

      {attempt && step === 'writing' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <PenLine className="h-5 w-5 text-primary-dark" />
                Writing Diagnostic
              </CardTitle>
              <CardDescription>
                Write both Academic Task 1 and Task 2. Mistral will evaluate them with IELTS rubric evidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 rounded-xl border border-secondary p-4">
                <div>
                  <p className="font-semibold text-text-main">Task 1 Academic</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{attempt.test.writing.task1.prompt}</p>
                  <p className="mt-2 rounded-lg bg-secondary/40 p-3 text-sm text-text-main">
                    {attempt.test.writing.task1.visualDescription}
                  </p>
                </div>
                <Textarea
                  rows={10}
                  value={writing.task1}
                  onChange={(event) => setWriting((prev) => ({ ...prev, task1: event.target.value }))}
                  placeholder="Write your Task 1 response here..."
                />
                <p className="text-xs text-text-muted">Word count: {countWords(writing.task1)}. Minimum for this diagnostic: 80 words.</p>
              </div>

              <div className="space-y-3 rounded-xl border border-secondary p-4">
                <div>
                  <p className="font-semibold text-text-main">Task 2: {attempt.test.writing.task2.questionType}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{attempt.test.writing.task2.prompt}</p>
                </div>
                <Textarea
                  rows={12}
                  value={writing.task2}
                  onChange={(event) => setWriting((prev) => ({ ...prev, task2: event.target.value }))}
                  placeholder="Write your Task 2 essay here..."
                />
                <p className="text-xs text-text-muted">Word count: {countWords(writing.task2)}. Minimum for this diagnostic: 120 words.</p>
              </div>

              {!canSubmitWriting && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <p>Both writing responses need enough text for a meaningful diagnostic score.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 md:flex-row md:justify-between">
              <Button variant="outline" onClick={() => setStep('reading')}>
                Back to Reading
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmitWriting || isSubmitting} className="rounded-full px-8">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  'Submit diagnostic'
                )}
              </Button>
            </CardFooter>
          </Card>

          <ListeningUploadPanel
            audioFile={audioFile}
            audioSourceNote={audioSourceNote}
            isUploadingAudio={isUploadingAudio}
            onFileChange={setAudioFile}
            onNoteChange={setAudioSourceNote}
            onUpload={handleUploadAudio}
          />
        </div>
      )}

      {step === 'result' && result && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary-dark" />
              Diagnostic Result
            </CardTitle>
            <CardDescription>
              Roadmap V1 uses scored Reading and Writing evidence. Listening and Speaking are survey-only placeholders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl bg-primary-light/40 p-4 text-center">
              <p className="text-sm text-text-muted">Estimated Reading/Writing baseline</p>
              <p className="font-headline text-5xl font-bold text-primary-dark">{result.overallBand.toFixed(1)}</p>
              <p className="mt-2 text-sm text-text-muted">
                Reading correct answers: {result.totalCorrect}/{result.totalQuestions}
              </p>
              {savedDiagnosticMeta && (
                <p className="mt-2 text-xs text-text-muted">
                  Saved on {new Date(savedDiagnosticMeta.takenAt).toLocaleString()} - valid until{' '}
                  {new Date(savedDiagnosticMeta.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {skillOrder.map((skill) => (
                <div key={skill} className="rounded-xl border border-secondary p-4">
                  <p className="text-sm text-text-muted">{placementSkillLabels[skill]}</p>
                  <p className="mt-1 font-headline text-3xl font-bold text-text-main">
                    {result.skillResults[skill].band.toFixed(1)}
                  </p>
                  {(skill === 'listening' || skill === 'speaking') && (
                    <p className="mt-1 text-xs text-amber-700">Survey-only in V1</p>
                  )}
                </div>
              ))}
            </div>

            {review?.writing && (
              <div className="space-y-4 rounded-xl border border-secondary p-4">
                <p className="font-semibold text-text-main">Writing review</p>
                <p className="text-sm leading-6 text-text-muted">{review.writing.summary}</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <ScoreTile label="TA/TR" value={review.writing.criteria.taskAchievement} />
                  <ScoreTile label="CC" value={review.writing.criteria.coherenceCohesion} />
                  <ScoreTile label="LR" value={review.writing.criteria.lexicalResource} />
                  <ScoreTile label="GRA" value={review.writing.criteria.grammarRangeAccuracy} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <p className="rounded-lg bg-secondary/30 p-3 text-sm text-text-muted">{review.writing.task1Feedback}</p>
                  <p className="rounded-lg bg-secondary/30 p-3 text-sm text-text-muted">{review.writing.task2Feedback}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-semibold">Priority skills</p>
                <p className="mt-1">{result.weakSkills.map((skill) => placementSkillLabels[skill]).join(', ')}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="font-semibold">Current strengths</p>
                <p className="mt-1">{result.strongSkills.map((skill) => placementSkillLabels[skill]).join(', ')}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Button variant="outline" onClick={() => {
              setAttempt(null);
              setAnswers({});
              setWriting({ task1: '', task2: '' });
              setResult(null);
              setReview(null);
              setStep('survey');
            }}>
              Start new diagnostic
            </Button>
            <Button asChild className="rounded-full px-8">
              <Link href="/roadmap">Generate roadmap from this result</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-secondary p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-main">{value.toFixed(1)}</p>
    </div>
  );
}

function ListeningUploadPanel({
  audioFile,
  audioSourceNote,
  isUploadingAudio,
  onFileChange,
  onNoteChange,
  onUpload,
}: {
  audioFile: File | null;
  audioSourceNote: string;
  isUploadingAudio: boolean;
  onFileChange: (file: File | null) => void;
  onNoteChange: (value: string) => void;
  onUpload: () => void;
}) {
  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
          <FileAudio className="h-5 w-5" />
          Listening audio upload preview
        </CardTitle>
        <CardDescription className="text-amber-800">
          This saves audio material for a future Listening pipeline. It is not transcribed or scored in V1.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Input
          type="file"
          accept="audio/*"
          label="Audio file"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />
        <Input
          label="Source note"
          value={audioSourceNote}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Example: Cambridge 17 Test 2 Part 3"
        />
        <Button onClick={onUpload} disabled={!audioFile || isUploadingAudio}>
          {isUploadingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Save audio
        </Button>
      </CardContent>
    </Card>
  );
}
