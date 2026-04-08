import { prisma } from '@/lib/prisma';

type GrammarStudyProgressDelegate = {
  findMany: <T = any>(args: Record<string, unknown>) => Promise<T[]>;
  upsert: <T = any>(args: Record<string, unknown>) => Promise<T>;
};

export function getGrammarStudyProgressDelegate(): GrammarStudyProgressDelegate | null {
  return (prisma as unknown as { grammarStudyProgress?: GrammarStudyProgressDelegate }).grammarStudyProgress ?? null;
}