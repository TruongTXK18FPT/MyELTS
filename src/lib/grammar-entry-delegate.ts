import { prisma } from '@/lib/prisma';

type GrammarEntryDelegate = {
  count: (args: Record<string, unknown>) => Promise<number>;
  createMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
  findMany: <T = any>(args: Record<string, unknown>) => Promise<T[]>;
  findFirst: <T = any>(args: Record<string, unknown>) => Promise<T | null>;
  create: <T = any>(args: Record<string, unknown>) => Promise<T>;
  update: <T = any>(args: Record<string, unknown>) => Promise<T>;
  updateMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
  deleteMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
};

export function getGrammarEntryDelegate(): GrammarEntryDelegate | null {
  return (prisma as unknown as { grammarEntry?: GrammarEntryDelegate }).grammarEntry ?? null;
}
