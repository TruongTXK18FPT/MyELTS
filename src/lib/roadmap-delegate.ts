import { prisma } from '@/lib/prisma';

type DelegateArgs = Record<string, unknown>;

type DiagnosticResultDelegate = {
  findFirst: <T = any>(args: DelegateArgs) => Promise<T | null>;
  create: <T = any>(args: DelegateArgs) => Promise<T>;
};

type DiagnosticAttemptDelegate = {
  findFirst: <T = any>(args: DelegateArgs) => Promise<T | null>;
  findUnique: <T = any>(args: DelegateArgs) => Promise<T | null>;
  create: <T = any>(args: DelegateArgs) => Promise<T>;
  update: <T = any>(args: DelegateArgs) => Promise<T>;
};

type ListeningAudioAssetDelegate = {
  create: <T = any>(args: DelegateArgs) => Promise<T>;
};

type RoadmapPlanDelegate = {
  findFirst: <T = any>(args: DelegateArgs) => Promise<T | null>;
  create: <T = any>(args: DelegateArgs) => Promise<T>;
  updateMany: <T = any>(args: DelegateArgs) => Promise<T>;
};

type RoadmapTaskDelegate = {
  findUnique: <T = any>(args: DelegateArgs) => Promise<T | null>;
  update: <T = any>(args: DelegateArgs) => Promise<T>;
};

type RoadmapWeekDelegate = {
  update: <T = any>(args: DelegateArgs) => Promise<T>;
};

type RoadmapReplanEventDelegate = {
  create: <T = any>(args: DelegateArgs) => Promise<T>;
};

export function getDiagnosticResultDelegate(client: unknown = prisma): DiagnosticResultDelegate | null {
  return (client as { diagnosticResult?: DiagnosticResultDelegate }).diagnosticResult ?? null;
}

export function getDiagnosticAttemptDelegate(client: unknown = prisma): DiagnosticAttemptDelegate | null {
  return (client as { diagnosticAttempt?: DiagnosticAttemptDelegate }).diagnosticAttempt ?? null;
}

export function getListeningAudioAssetDelegate(client: unknown = prisma): ListeningAudioAssetDelegate | null {
  return (client as { listeningAudioAsset?: ListeningAudioAssetDelegate }).listeningAudioAsset ?? null;
}

export function getRoadmapPlanDelegate(client: unknown = prisma): RoadmapPlanDelegate | null {
  return (client as { roadmapPlan?: RoadmapPlanDelegate }).roadmapPlan ?? null;
}

export function getRoadmapTaskDelegate(client: unknown = prisma): RoadmapTaskDelegate | null {
  return (client as { roadmapTask?: RoadmapTaskDelegate }).roadmapTask ?? null;
}

export function getRoadmapWeekDelegate(client: unknown = prisma): RoadmapWeekDelegate | null {
  return (client as { roadmapWeek?: RoadmapWeekDelegate }).roadmapWeek ?? null;
}

export function getRoadmapReplanEventDelegate(client: unknown = prisma): RoadmapReplanEventDelegate | null {
  return (client as { roadmapReplanEvent?: RoadmapReplanEventDelegate }).roadmapReplanEvent ?? null;
}
