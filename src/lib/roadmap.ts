import type { PlacementSkillKey } from '@/lib/diagnostic-placement-test';

export const placementSkillKeyToEnum = {
  listening: 'LISTENING',
  reading: 'READING',
  writing: 'WRITING',
  speaking: 'SPEAKING',
} as const;

export const placementSkillEnumToKey = {
  LISTENING: 'listening',
  READING: 'reading',
  WRITING: 'writing',
  SPEAKING: 'speaking',
} as const;

export const placementSkillLabels: Record<PlacementSkillKey, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

export type PlacementSkillEnum = (typeof placementSkillKeyToEnum)[PlacementSkillKey];
export type RoadmapTaskStatusEnum = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export type DiagnosticSnapshot = {
  id: string;
  takenAt: string;
  expiresAt: string;
  overallBand: number;
  skillBands: Record<PlacementSkillKey, number>;
  weakSkills: PlacementSkillKey[];
  strongSkills: PlacementSkillKey[];
};

export type RoadmapTaskBlueprint = {
  title: string;
  skill: PlacementSkillKey;
  taskType: string;
  linkedPath: string;
  estimatedMinutes: number;
  mandatory: boolean;
};

export type RoadmapWeekBlueprint = {
  weekIndex: number;
  phase: string;
  focusSkills: PlacementSkillKey[];
  targetHours: number;
  successCriteria: string;
  tasks: RoadmapTaskBlueprint[];
};

export type RoadmapBlueprint = {
  weekCount: number;
  estimatedTimeline: string;
  skillGapsSummary: string;
  weeks: RoadmapWeekBlueprint[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function estimateRequiredHours(currentBand: number, targetBand: number): number {
  const gap = Math.max(0, targetBand - currentBand);

  if (gap <= 0.25) {
    return 40;
  }

  return Math.max(80, Math.ceil(gap * 120));
}

export function estimateWeeks(requiredHours: number, availableTimePerWeek: number): number {
  const safeHours = Math.max(3, availableTimePerWeek);
  const computedWeeks = Math.ceil(requiredHours / safeHours);

  return clamp(computedWeeks, 4, 24);
}

export function isDiagnosticExpired(expiresAtIso: string): boolean {
  return new Date(expiresAtIso).getTime() < Date.now();
}

export function getDiagnosticAgeDays(takenAtIso: string): number {
  const takenAt = new Date(takenAtIso).getTime();
  const diff = Date.now() - takenAt;

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getSkillWeightMap(
  diagnosticBands: Record<PlacementSkillKey, number>,
  targetBandScore: number,
  weakSkills: PlacementSkillKey[]
): Record<PlacementSkillKey, number> {
  const keys: PlacementSkillKey[] = ['listening', 'reading', 'writing', 'speaking'];
  const weakSet = new Set(weakSkills);

  return keys.reduce<Record<PlacementSkillKey, number>>((acc, skill) => {
    const gap = Math.max(0, targetBandScore - diagnosticBands[skill]);
    const weakBoost = weakSet.has(skill) ? 1.2 : 0;
    acc[skill] = Math.max(0.6, gap + 0.6 + weakBoost);

    return acc;
  }, {
    listening: 1,
    reading: 1,
    writing: 1,
    speaking: 1,
  });
}

function allocateSkillMinutes(
  totalMinutes: number,
  weights: Record<PlacementSkillKey, number>
): Record<PlacementSkillKey, number> {
  const keys: PlacementSkillKey[] = ['listening', 'reading', 'writing', 'speaking'];
  const totalWeight = keys.reduce((sum, skill) => sum + weights[skill], 0);

  const allocation = keys.reduce<Record<PlacementSkillKey, number>>((acc, skill) => {
    acc[skill] = Math.floor((weights[skill] / totalWeight) * totalMinutes);
    return acc;
  }, {
    listening: 0,
    reading: 0,
    writing: 0,
    speaking: 0,
  });

  const consumed = keys.reduce((sum, skill) => sum + allocation[skill], 0);
  if (consumed < totalMinutes) {
    const sorted = [...keys].sort((a, b) => weights[b] - weights[a]);
    let remaining = totalMinutes - consumed;
    let index = 0;

    while (remaining > 0) {
      const skill = sorted[index % sorted.length];
      allocation[skill] += 1;
      remaining -= 1;
      index += 1;
    }
  }

  return allocation;
}

function getPhaseName(weekIndex: number, weekCount: number): string {
  const ratio = weekIndex / weekCount;

  if (ratio <= 0.33) {
    return 'Foundation';
  }

  if (ratio <= 0.75) {
    return 'Skill Development';
  }

  return 'Exam Readiness';
}

function buildWeeklyTasks(
  minutesBySkill: Record<PlacementSkillKey, number>,
  weakSkills: PlacementSkillKey[],
  weekIndex: number
): RoadmapTaskBlueprint[] {
  const weakOrder: PlacementSkillKey[] = weakSkills.length > 0 ? weakSkills : ['writing', 'speaking'];
  const primaryWeak = weakOrder[0];
  const secondaryWeak = weakOrder[1] ?? primaryWeak;

  const tasks: RoadmapTaskBlueprint[] = [
    {
      title: 'Complete 1 Reading section and review all wrong answers',
      skill: 'reading',
      taskType: 'section_test',
      linkedPath: '/tests',
      estimatedMinutes: Math.max(50, Math.floor(minutesBySkill.reading * 0.65)),
      mandatory: true,
    },
    {
      title: 'Complete 1 Listening section with transcript error review',
      skill: 'listening',
      taskType: 'section_test',
      linkedPath: '/tests',
      estimatedMinutes: Math.max(50, Math.floor(minutesBySkill.listening * 0.65)),
      mandatory: true,
    },
    {
      title: 'Write 1 Task 2 essay and request AI rubric feedback',
      skill: 'writing',
      taskType: 'writing_practice',
      linkedPath: '/ai-chat',
      estimatedMinutes: Math.max(60, Math.floor(minutesBySkill.writing * 0.7)),
      mandatory: true,
    },
    {
      title: 'Record Speaking Part 2 + Part 3 practice and review feedback',
      skill: 'speaking',
      taskType: 'speaking_practice',
      linkedPath: '/ai-chat',
      estimatedMinutes: Math.max(55, Math.floor(minutesBySkill.speaking * 0.7)),
      mandatory: true,
    },
    {
      title: `Weak-skill booster: focused drill for ${placementSkillLabels[primaryWeak]}`,
      skill: primaryWeak,
      taskType: 'weak_skill_booster',
      linkedPath: primaryWeak === 'writing' || primaryWeak === 'speaking' ? '/ai-chat' : '/tests',
      estimatedMinutes: 45,
      mandatory: true,
    },
    {
      title: `Weak-skill booster: targeted correction cycle for ${placementSkillLabels[secondaryWeak]}`,
      skill: secondaryWeak,
      taskType: 'weak_skill_booster',
      linkedPath: secondaryWeak === 'writing' || secondaryWeak === 'speaking' ? '/ai-chat' : '/tests',
      estimatedMinutes: 40,
      mandatory: true,
    },
    {
      title: `Vocabulary + Grammar consolidation set (Week ${weekIndex})`,
      skill: weekIndex % 2 === 0 ? 'writing' : 'reading',
      taskType: 'language_system',
      linkedPath: weekIndex % 2 === 0 ? '/vocabulary' : '/grammar',
      estimatedMinutes: 35,
      mandatory: false,
    },
  ];

  return tasks;
}

export function buildRoadmapBlueprint(input: {
  diagnosticBands: Record<PlacementSkillKey, number>;
  diagnosticOverallBand: number;
  weakSkills: PlacementSkillKey[];
  targetBandScore: number;
  availableTimePerWeek: number;
}): RoadmapBlueprint {
  const requiredHours = estimateRequiredHours(input.diagnosticOverallBand, input.targetBandScore);
  const weekCount = estimateWeeks(requiredHours, input.availableTimePerWeek);
  const totalMinutesPerWeek = Math.max(180, input.availableTimePerWeek * 60);
  const weightMap = getSkillWeightMap(input.diagnosticBands, input.targetBandScore, input.weakSkills);

  const weeks: RoadmapWeekBlueprint[] = [];

  for (let week = 1; week <= weekCount; week += 1) {
    const phase = getPhaseName(week, weekCount);
    const minutesBySkill = allocateSkillMinutes(totalMinutesPerWeek, weightMap);
    const focusSkills = [...input.weakSkills].slice(0, 2);

    if (focusSkills.length === 0) {
      focusSkills.push('writing', 'speaking');
    }

    weeks.push({
      weekIndex: week,
      phase,
      focusSkills,
      targetHours: input.availableTimePerWeek,
      successCriteria:
        week % 4 === 0
          ? 'Complete one mock section set and reduce repeated error types by at least 20%.'
          : 'Complete all mandatory tasks and keep weekly completion at or above 75%.',
      tasks: buildWeeklyTasks(minutesBySkill, input.weakSkills, week),
    });
  }

  const weakSummary = input.weakSkills.length > 0
    ? input.weakSkills.map((skill) => placementSkillLabels[skill]).join(', ')
    : 'Writing, Speaking';
  const monthEstimate = roundHalf(weekCount / 4);

  return {
    weekCount,
    estimatedTimeline: `${weekCount} weeks (~${monthEstimate} months)`,
    skillGapsSummary: `Priority skills from diagnostic: ${weakSummary}`,
    weeks,
  };
}

export function calculateRoadmapProgress(weeks: Array<{ tasks: Array<{ status: RoadmapTaskStatusEnum }> }>) {
  const totalTasks = weeks.reduce((sum, week) => sum + week.tasks.length, 0);
  const completedTasks = weeks.reduce((sum, week) => {
    return sum + week.tasks.filter((task) => task.status === 'COMPLETED').length;
  }, 0);

  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return {
    completedTasks,
    totalTasks,
    progressPercent,
  };
}

export function toPlacementSkillKeys(values: string[] | undefined | null): PlacementSkillKey[] {
  if (!values || values.length === 0) {
    return [];
  }

  return values
    .map((value) => placementSkillEnumToKey[value as keyof typeof placementSkillEnumToKey])
    .filter(Boolean) as PlacementSkillKey[];
}
