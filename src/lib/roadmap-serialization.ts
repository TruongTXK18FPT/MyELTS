import {
  calculateRoadmapProgress,
  isDiagnosticExpired,
  placementSkillEnumToKey,
  toPlacementSkillKeys,
} from '@/lib/roadmap';

type DiagnosticRecord = {
  id: string;
  takenAt: Date;
  expiresAt: Date;
  overallBand: number;
  listeningBand: number;
  readingBand: number;
  writingBand: number;
  speakingBand: number;
  weakSkills: string[];
  strongSkills: string[];
};

type TaskRecord = {
  id: string;
  title: string;
  taskType: string;
  linkedPath: string | null;
  estimatedMinutes: number;
  mandatory: boolean;
  dueDate: Date | null;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completedAt: Date | null;
  notes: string | null;
  skill: string;
};

type WeekRecord = {
  id: string;
  weekIndex: number;
  phase: string | null;
  focusSkills: string[];
  targetHours: number;
  successCriteria: string | null;
  tasks: TaskRecord[];
};

type ReplanEventRecord = {
  id: string;
  reason: string;
  completionRate: number | null;
  adjustmentPercent: number | null;
  summary: string | null;
  createdAt: Date;
};

type RoadmapPlanRecord = {
  id: string;
  status: 'ACTIVE' | 'ARCHIVED';
  targetBandScore: number;
  availableTimePerWeek: number;
  estimatedTimeline: string;
  skillGaps: string | null;
  weeklyStudyPlanText: string;
  suggestedResourcesText: string;
  studyMaterialsPreference: string | null;
  createdAt: Date;
  updatedAt: Date;
  weeks?: WeekRecord[];
  replanEvents?: ReplanEventRecord[];
};

export function serializeDiagnosticRecord(record: DiagnosticRecord) {
  const expiresAtIso = record.expiresAt.toISOString();

  return {
    id: record.id,
    takenAt: record.takenAt.toISOString(),
    expiresAt: expiresAtIso,
    isExpired: isDiagnosticExpired(expiresAtIso),
    overallBand: record.overallBand,
    skillBands: {
      listening: record.listeningBand,
      reading: record.readingBand,
      writing: record.writingBand,
      speaking: record.speakingBand,
    },
    weakSkills: toPlacementSkillKeys(record.weakSkills),
    strongSkills: toPlacementSkillKeys(record.strongSkills),
  };
}

export function serializeRoadmapPlan(plan: RoadmapPlanRecord) {
  const mappedWeeks = (plan.weeks || [])
    .slice()
    .sort((a, b) => a.weekIndex - b.weekIndex)
    .map((week) => ({
      id: week.id,
      weekIndex: week.weekIndex,
      phase: week.phase,
      focusSkills: toPlacementSkillKeys(week.focusSkills),
      targetHours: week.targetHours,
      successCriteria: week.successCriteria,
      tasks: week.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        taskType: task.taskType,
        linkedPath: task.linkedPath,
        estimatedMinutes: task.estimatedMinutes,
        mandatory: task.mandatory,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        status: task.status,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        notes: task.notes,
        skill: placementSkillEnumToKey[task.skill as keyof typeof placementSkillEnumToKey],
      })),
    }));

  const progress = calculateRoadmapProgress(
    mappedWeeks.map((week) => ({
      tasks: week.tasks.map((task) => ({ status: task.status })),
    }))
  );

  return {
    id: plan.id,
    status: plan.status,
    targetBandScore: plan.targetBandScore,
    availableTimePerWeek: plan.availableTimePerWeek,
    estimatedTimeline: plan.estimatedTimeline,
    skillGaps: plan.skillGaps,
    weeklyStudyPlanText: plan.weeklyStudyPlanText,
    suggestedResourcesText: plan.suggestedResourcesText,
    studyMaterialsPreference: plan.studyMaterialsPreference,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    weeks: mappedWeeks,
    replanEvents: (plan.replanEvents || []).map((event) => ({
      id: event.id,
      reason: event.reason,
      completionRate: event.completionRate,
      adjustmentPercent: event.adjustmentPercent,
      summary: event.summary,
      createdAt: event.createdAt.toISOString(),
    })),
    progress,
  };
}
