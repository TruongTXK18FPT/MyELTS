'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, Loader2, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  evaluatePlacementAnswers,
  placementQuestions,
  placementSkillLabels,
  PlacementResult,
  PlacementSkillKey,
} from '@/lib/diagnostic-placement-test';

const skillOrder: PlacementSkillKey[] = ['reading', 'listening', 'writing', 'speaking'];

const skillGuidance: Record<PlacementSkillKey, string> = {
  reading: 'Focus on skimming, scanning, and detail matching.',
  listening: 'Focus on key-detail capture and distractor awareness.',
  writing: 'Focus on structure, formal tone, and grammar accuracy.',
  speaking: 'Focus on idea development, coherence, and lexical range.',
};

export function DiagnosticPlacementTest() {
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDiagnosticMeta, setSavedDiagnosticMeta] = useState<{
    takenAt: string;
    expiresAt: string;
  } | null>(null);

  const totalQuestions = placementQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const groupedQuestions = useMemo(() => {
    return skillOrder.reduce<Record<PlacementSkillKey, typeof placementQuestions>>((acc, skill) => {
      acc[skill] = placementQuestions.filter((question) => question.skill === skill);
      return acc;
    }, {
      reading: [],
      listening: [],
      writing: [],
      speaking: [],
    });
  }, []);

  const canSubmit = answeredCount === totalQuestions;

  const handleAnswerChange = (questionId: string, optionId: string) => {
    if (submitted) {
      return;
    }

    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const localResult = evaluatePlacementAnswers(answers);

    setSubmitted(true);
    setResult(localResult);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tests/diagnostic/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      const data = (await response.json()) as {
        diagnostic?: { takenAt: string; expiresAt: string };
        result?: PlacementResult;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Cannot save diagnostic result.');
      }

      if (data.result) {
        setResult(data.result);
      }

      if (data.diagnostic) {
        setSavedDiagnosticMeta(data.diagnostic);
      }

      toast({
        title: 'Diagnostic submitted',
        description: 'Result has been saved and is now available for roadmap generation.',
      });
    } catch (error) {
      toast({
        title: 'Diagnostic saved locally only',
        description:
          error instanceof Error
            ? error.message
            : 'Your result is shown, but save request failed.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setSavedDiagnosticMeta(null);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ClipboardCheck className="h-6 w-6 text-primary-dark" />
            Diagnostic Placement Test
          </CardTitle>
          <CardDescription>
            Complete all questions to estimate your current IELTS band before generating your roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col justify-between gap-3 text-sm text-text-muted md:flex-row md:items-center">
            <span>{answeredCount}/{totalQuestions} questions completed</span>
            <span>Estimated time: 12-15 minutes</span>
          </div>
          <ProgressBar value={progress} />
          {!canSubmit && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <p>Please answer all questions to unlock your estimated band result.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {skillOrder.map((skill, skillIndex) => (
        <Card key={skill}>
          <CardHeader>
            <CardTitle className="text-xl">
              Section {skillIndex + 1}: {placementSkillLabels[skill]}
            </CardTitle>
            <CardDescription>{skillGuidance[skill]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {groupedQuestions[skill].map((question, questionIndex) => {
              const selectedOption = answers[question.id] ?? '';
              const isCorrect = selectedOption === question.correctOptionId;

              return (
                <div key={question.id} className="space-y-3 rounded-xl border border-secondary p-4">
                  <p className="font-medium text-text-main">
                    {skillIndex * 5 + questionIndex + 1}. {question.prompt}
                  </p>

                  <RadioGroup
                    value={selectedOption}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    className="space-y-3"
                  >
                    {question.options.map((option) => {
                      const optionId = `${question.id}-${option.id}`;

                      return (
                        <div key={option.id} className="flex items-start gap-3 rounded-lg border border-secondary/70 p-3">
                          <RadioGroupItem id={optionId} value={option.id} disabled={submitted} />
                          <Label htmlFor={optionId} className="cursor-pointer text-sm leading-6 text-text-main">
                            {option.text}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {submitted && (
                    <div className="space-y-2 rounded-lg bg-secondary/40 p-3 text-sm">
                      <div className={`flex items-center gap-2 ${isCorrect ? 'text-green-700' : 'text-rose-700'}`}>
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span>
                          {isCorrect
                            ? 'Correct answer.'
                            : `Correct answer: ${question.options.find((option) => option.id === question.correctOptionId)?.text}`}
                        </span>
                      </div>
                      <p className="text-text-muted">{question.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {!submitted && (
        <div className="flex justify-end">
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit || isSubmitting} className="rounded-full px-8">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scoring...
              </>
            ) : (
              'Score test and estimate band'
            )}
          </Button>
        </div>
      )}

      {result && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary-dark" />
              Placement Result
            </CardTitle>
            <CardDescription>
              This estimate is for roadmap planning and should be refreshed after each full mock test cycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl bg-primary-light/40 p-4 text-center">
              <p className="text-sm text-text-muted">Estimated current overall band</p>
              <p className="font-headline text-5xl font-bold text-primary-dark">{result.overallBand.toFixed(1)}</p>
              <p className="mt-2 text-sm text-text-muted">
                Correct answers: {result.totalCorrect}/{result.totalQuestions}
              </p>
              {savedDiagnosticMeta && (
                <p className="mt-2 text-xs text-text-muted">
                  Saved on {new Date(savedDiagnosticMeta.takenAt).toLocaleString()} • valid until{' '}
                  {new Date(savedDiagnosticMeta.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {skillOrder.map((skill) => (
                <div key={skill} className="rounded-xl border border-secondary p-4">
                  <p className="text-sm text-text-muted">{placementSkillLabels[skill]}</p>
                  <p className="mt-1 font-headline text-3xl font-bold text-text-main">
                    {result.skillResults[skill].band.toFixed(1)}
                  </p>
                  <p className="text-sm text-text-muted">
                    {result.skillResults[skill].correct}/{result.skillResults[skill].total} correct
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-700">Priority to improve</p>
                <p className="mt-2 text-sm text-rose-800">
                  {result.weakSkills.map((skill) => placementSkillLabels[skill]).join(', ')}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">Current strengths</p>
                <p className="mt-2 text-sm text-emerald-800">
                  {result.strongSkills.map((skill) => placementSkillLabels[skill]).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Button variant="outline" onClick={handleReset}>
              Retake test
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
