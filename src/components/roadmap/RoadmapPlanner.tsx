'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, Loader2, RefreshCw, Target, Timer, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { placementSkillLabels } from '@/lib/roadmap';

type PlacementSkillKey = 'listening' | 'reading' | 'writing' | 'speaking';
type RoadmapTaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

type DiagnosticData = {
  id: string;
  takenAt: string;
  expiresAt: string;
  isExpired: boolean;
  overallBand: number;
  skillBands: Record<PlacementSkillKey, number>;
  weakSkills: PlacementSkillKey[];
  strongSkills: PlacementSkillKey[];
};

type RoadmapTaskData = {
  id: string;
  title: string;
  taskType: string;
  linkedPath: string | null;
  estimatedMinutes: number;
  mandatory: boolean;
  dueDate: string | null;
  status: RoadmapTaskStatus;
  completedAt: string | null;
  notes: string | null;
  skill: PlacementSkillKey;
};

type RoadmapWeekData = {
  id: string;
  weekIndex: number;
  phase: string | null;
  focusSkills: PlacementSkillKey[];
  targetHours: number;
  successCriteria: string | null;
  tasks: RoadmapTaskData[];
};

type RoadmapPlanData = {
  id: string;
  status: 'ACTIVE' | 'ARCHIVED';
  targetBandScore: number;
  availableTimePerWeek: number;
  estimatedTimeline: string;
  skillGaps: string | null;
  weeklyStudyPlanText: string;
  suggestedResourcesText: string;
  studyMaterialsPreference: string | null;
  createdAt: string;
  updatedAt: string;
  weeks: RoadmapWeekData[];
  replanEvents: Array<{
    id: string;
    reason: string;
    completionRate: number | null;
    adjustmentPercent: number | null;
    summary: string | null;
    createdAt: string;
  }>;
  progress: {
    completedTasks: number;
    totalTasks: number;
    progressPercent: number;
  };
};

type CurrentRoadmapResponse = {
  diagnostic: DiagnosticData | null;
  plan: RoadmapPlanData | null;
  error?: string;
};

function getStatusLabel(status: RoadmapTaskStatus): string {
  if (status === 'COMPLETED') {
    return 'Completed';
  }

  if (status === 'IN_PROGRESS') {
    return 'In Progress';
  }

  if (status === 'SKIPPED') {
    return 'Skipped';
  }

  return 'Todo';
}

function getStatusClassName(status: RoadmapTaskStatus): string {
  if (status === 'COMPLETED') {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  }

  if (status === 'IN_PROGRESS') {
    return 'bg-sky-100 text-sky-700 border border-sky-200';
  }

  if (status === 'SKIPPED') {
    return 'bg-amber-100 text-amber-700 border border-amber-200';
  }

  return 'bg-secondary text-text-muted border border-secondary';
}

function getDefaultTargetBand(overallBand: number): string {
  const suggested = Math.min(8.0, Math.max(6.0, overallBand + 1.0));
  return suggested.toFixed(1);
}

export function RoadmapPlanner() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submittingGenerate, setSubmittingGenerate] = useState(false);
  const [submittingReplan, setSubmittingReplan] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [plan, setPlan] = useState<RoadmapPlanData | null>(null);
  const [targetBandScore, setTargetBandScore] = useState('7.0');
  const [availableTimePerWeek, setAvailableTimePerWeek] = useState('8');
  const [materialsPreference, setMaterialsPreference] = useState('');
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());

  const loadCurrentRoadmap = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/roadmap/current', { cache: 'no-store' });
      const data = (await response.json()) as CurrentRoadmapResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Cannot load roadmap state.');
      }

      setDiagnostic(data.diagnostic);
      setPlan(data.plan);

      if (data.plan) {
        setTargetBandScore(data.plan.targetBandScore.toFixed(1));
        setAvailableTimePerWeek(String(data.plan.availableTimePerWeek));
        setMaterialsPreference(data.plan.studyMaterialsPreference || '');
      } else if (data.diagnostic) {
        setTargetBandScore(getDefaultTargetBand(data.diagnostic.overallBand));
      }
    } catch (error) {
      toast({
        title: 'Cannot load roadmap',
        description: error instanceof Error ? error.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadCurrentRoadmap();
  }, [loadCurrentRoadmap]);

  const canGenerateRoadmap = useMemo(() => {
    if (!diagnostic) {
      return false;
    }

    if (diagnostic.isExpired) {
      return false;
    }

    const parsedTarget = Number(targetBandScore);
    const parsedHours = Number(availableTimePerWeek);

    if (!Number.isFinite(parsedTarget) || !Number.isFinite(parsedHours)) {
      return false;
    }

    if (parsedTarget < 4 || parsedTarget > 9) {
      return false;
    }

    return parsedHours >= 3 && parsedHours <= 40;
  }, [availableTimePerWeek, diagnostic, targetBandScore]);

  const handleGenerateRoadmap = async () => {
    if (!canGenerateRoadmap) {
      return;
    }

    setSubmittingGenerate(true);

    try {
      const response = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetBandScore: Number(targetBandScore),
          availableTimePerWeek: Number(availableTimePerWeek),
          studyMaterialsPreference: materialsPreference.trim() || null,
        }),
      });

      const data = (await response.json()) as {
        plan?: RoadmapPlanData;
        meta?: { aiEnhanced?: boolean };
        error?: string;
      };

      if (!response.ok || !data.plan) {
        throw new Error(data.error || 'Cannot generate roadmap.');
      }

      setPlan(data.plan);

      toast({
        title: 'Roadmap generated',
        description: data.meta?.aiEnhanced
          ? 'Roadmap has been generated with AI enhancement and deterministic rules.'
          : 'Roadmap has been generated with deterministic planning rules.',
      });
    } catch (error) {
      toast({
        title: 'Roadmap generation failed',
        description: error instanceof Error ? error.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingGenerate(false);
    }
  };

  const handleToggleTask = async (task: RoadmapTaskData, nextCompleted: boolean) => {
    const nextStatus: RoadmapTaskStatus = nextCompleted ? 'COMPLETED' : 'TODO';

    setUpdatingTaskIds((prev) => {
      const next = new Set(prev);
      next.add(task.id);
      return next;
    });

    try {
      const response = await fetch(`/api/roadmap/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const data = (await response.json()) as { plan?: RoadmapPlanData; error?: string };

      if (!response.ok || !data.plan) {
        throw new Error(data.error || 'Cannot update task status.');
      }

      setPlan(data.plan);
    } catch (error) {
      toast({
        title: 'Task update failed',
        description: error instanceof Error ? error.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleReplan = async () => {
    setSubmittingReplan(true);

    try {
      const response = await fetch('/api/roadmap/replan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'manual_replan_from_roadmap_ui',
        }),
      });

      const data = (await response.json()) as {
        plan?: RoadmapPlanData;
        meta?: { adjustmentPercent: number };
        error?: string;
      };

      if (!response.ok || !data.plan) {
        throw new Error(data.error || 'Cannot replan roadmap.');
      }

      setPlan(data.plan);

      const adjustment = data.meta?.adjustmentPercent ?? 0;
      toast({
        title: 'Roadmap replanned',
        description:
          adjustment === 0
            ? 'No workload adjustment was required.'
            : `Workload has been adjusted by ${adjustment}% for pending tasks.`,
      });
    } catch (error) {
      toast({
        title: 'Replan failed',
        description: error instanceof Error ? error.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReplan(false);
    }
  };

  if (loading) {
    return (
      <Card className="mt-8">
        <CardContent className="flex items-center justify-center gap-2 p-10 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading roadmap data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {!diagnostic && (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Diagnostic test is required first
            </CardTitle>
            <CardDescription className="text-amber-700">
              Complete the entrance diagnostic test before creating your personalized roadmap.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/tests/diagnostic">Take Diagnostic Placement Test</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {diagnostic && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary-dark" />
              Latest Diagnostic Snapshot
            </CardTitle>
            <CardDescription>
              This snapshot is used as the starting point for roadmap generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {diagnostic.isExpired && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Your diagnostic result is older than 30 days. Retake is required before generating a new roadmap.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-secondary p-4">
                <p className="text-sm text-text-muted">Overall estimated band</p>
                <p className="mt-1 text-4xl font-bold text-primary-dark">{diagnostic.overallBand.toFixed(1)}</p>
              </div>
              <div className="rounded-xl border border-secondary p-4">
                <p className="text-sm text-text-muted">Diagnostic date</p>
                <p className="mt-1 font-medium text-text-main">{new Date(diagnostic.takenAt).toLocaleDateString()}</p>
              </div>
              <div className="rounded-xl border border-secondary p-4">
                <p className="text-sm text-text-muted">Diagnostic expiry</p>
                <p className="mt-1 font-medium text-text-main">{new Date(diagnostic.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(Object.entries(diagnostic.skillBands) as Array<[PlacementSkillKey, number]>).map(([skill, band]) => (
                <div key={skill} className="rounded-xl border border-secondary p-4">
                  <p className="text-sm text-text-muted">{placementSkillLabels[skill]}</p>
                  <p className="mt-1 text-2xl font-bold text-text-main">{band.toFixed(1)}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-semibold">Priority skills</p>
                <p className="mt-1">
                  {diagnostic.weakSkills.length > 0
                    ? diagnostic.weakSkills.map((skill) => placementSkillLabels[skill]).join(', ')
                    : 'Will be determined from score distribution.'}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="font-semibold">Current strengths</p>
                <p className="mt-1">
                  {diagnostic.strongSkills.length > 0
                    ? diagnostic.strongSkills.map((skill) => placementSkillLabels[skill]).join(', ')
                    : 'No strong skill detected yet.'}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild variant="outline">
              <Link href="/tests/diagnostic">Retake diagnostic</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {diagnostic && !plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Generate Personalized Roadmap</CardTitle>
            <CardDescription>
              Configure your target and weekly study load. The system uses your latest diagnostic as baseline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                type="number"
                step="0.5"
                min="4"
                max="9"
                label="Target band"
                value={targetBandScore}
                onChange={(event) => setTargetBandScore(event.target.value)}
              />
              <Input
                type="number"
                step="1"
                min="3"
                max="40"
                label="Available hours per week"
                value={availableTimePerWeek}
                onChange={(event) => setAvailableTimePerWeek(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-text-main">Study materials preference (optional)</p>
              <Textarea
                rows={4}
                placeholder="Example: Cambridge books, BBC podcasts, writing correction in Vietnamese..."
                value={materialsPreference}
                onChange={(event) => setMaterialsPreference(event.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Button variant="outline" onClick={() => void loadCurrentRoadmap()}>
              Reload state
            </Button>
            <Button
              onClick={handleGenerateRoadmap}
              disabled={!canGenerateRoadmap || submittingGenerate}
              className="rounded-full px-8"
            >
              {submittingGenerate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate roadmap'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {plan && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Current Learning Roadmap</CardTitle>
              <CardDescription>
                Deterministic planning + AI recommendations. Update task status to keep the roadmap adaptive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-secondary p-4">
                  <p className="text-sm text-text-muted">Target band</p>
                  <p className="mt-1 text-3xl font-bold text-primary-dark">{plan.targetBandScore.toFixed(1)}</p>
                </div>
                <div className="rounded-xl border border-secondary p-4">
                  <p className="text-sm text-text-muted">Available time</p>
                  <p className="mt-1 text-2xl font-bold text-text-main">{plan.availableTimePerWeek} h/week</p>
                </div>
                <div className="rounded-xl border border-secondary p-4">
                  <p className="text-sm text-text-muted">Estimated timeline</p>
                  <p className="mt-1 text-xl font-bold text-text-main">{plan.estimatedTimeline}</p>
                </div>
                <div className="rounded-xl border border-secondary p-4">
                  <p className="text-sm text-text-muted">Progress</p>
                  <p className="mt-1 text-2xl font-bold text-text-main">
                    {plan.progress.completedTasks}/{plan.progress.totalTasks}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-text-muted">
                  <span>Roadmap completion</span>
                  <span>{plan.progress.progressPercent}%</span>
                </div>
                <ProgressBar value={plan.progress.progressPercent} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-secondary p-4">
                  <p className="text-sm font-semibold text-text-main">Skill gap strategy</p>
                  <p className="mt-2 text-sm text-text-muted">{plan.skillGaps || 'No skill gap summary available.'}</p>
                </div>
                <div className="rounded-xl border border-secondary p-4">
                  <p className="text-sm font-semibold text-text-main">Resource strategy</p>
                  <p className="mt-2 whitespace-pre-line text-sm text-text-muted">{plan.suggestedResourcesText}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 rounded-xl border border-secondary bg-secondary/20 p-4">
                <p className="text-sm font-semibold text-text-main">Weekly AI guidance</p>
                <p className="whitespace-pre-line text-sm text-text-muted">{plan.weeklyStudyPlanText}</p>
              </div>

              {plan.replanEvents.length > 0 && (
                <div className="space-y-2 rounded-xl border border-secondary p-4">
                  <p className="text-sm font-semibold text-text-main">Recent replan history</p>
                  <div className="space-y-2 text-sm text-text-muted">
                    {plan.replanEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border border-secondary p-3">
                        <p className="font-medium text-text-main">{event.summary || event.reason}</p>
                        <p>
                          {new Date(event.createdAt).toLocaleString()} • adjustment: {event.adjustmentPercent ?? 0}% • completion:{' '}
                          {event.completionRate !== null ? `${Math.round(event.completionRate * 100)}%` : 'n/a'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 md:flex-row md:justify-end">
              <Button variant="outline" onClick={() => void loadCurrentRoadmap()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleReplan} disabled={submittingReplan}>
                {submittingReplan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Replanning...
                  </>
                ) : (
                  <>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Replan workload
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-5">
            {plan.weeks.map((week) => (
              <Card key={week.id}>
                <CardHeader>
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <CardTitle className="text-xl">Week {week.weekIndex}</CardTitle>
                      <CardDescription>
                        {week.phase || 'Learning cycle'} • {week.targetHours}h target
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Target className="h-4 w-4" />
                      <span>
                        Focus: {week.focusSkills.map((skill) => placementSkillLabels[skill]).join(', ') || 'Balanced'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {week.successCriteria && (
                    <p className="rounded-lg border border-secondary bg-secondary/20 p-3 text-sm text-text-muted">
                      {week.successCriteria}
                    </p>
                  )}

                  <div className="space-y-3">
                    {week.tasks.map((task) => (
                      <div key={task.id} className="rounded-xl border border-secondary p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={task.status === 'COMPLETED'}
                              disabled={updatingTaskIds.has(task.id)}
                              onCheckedChange={(checked) => {
                                const isChecked = checked === true;
                                void handleToggleTask(task, isChecked);
                              }}
                            />
                            <div>
                              <p className="font-medium text-text-main">{task.title}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                                <span className="rounded-full bg-secondary px-2 py-1">{placementSkillLabels[task.skill]}</span>
                                <span className={getStatusClassName(task.status)}>{getStatusLabel(task.status)}</span>
                                <span className="rounded-full bg-secondary px-2 py-1">{task.estimatedMinutes} min</span>
                                <span className="rounded-full bg-secondary px-2 py-1">
                                  {task.mandatory ? 'Mandatory' : 'Optional'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-2 md:items-end">
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-text-muted">
                                <Timer className="h-3.5 w-3.5" />
                                Due {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            {task.linkedPath && (
                              <Button asChild variant="link" className="h-auto p-0">
                                <Link href={task.linkedPath}>Open learning module</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
