import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prismaClientFromCache = globalForPrisma.prisma
const cachedDelegates = prismaClientFromCache as unknown as {
  grammarEntry?: unknown
  grammarStudyProgress?: unknown
  diagnosticResult?: unknown
  roadmapPlan?: unknown
  roadmapWeek?: unknown
  roadmapTask?: unknown
  roadmapReplanEvent?: unknown
}

const needsRefreshForSchemaChange =
  process.env.NODE_ENV !== 'production' &&
  prismaClientFromCache &&
  (typeof cachedDelegates.grammarEntry === 'undefined' ||
    typeof cachedDelegates.grammarStudyProgress === 'undefined' ||
    typeof cachedDelegates.diagnosticResult === 'undefined' ||
    typeof cachedDelegates.roadmapPlan === 'undefined' ||
    typeof cachedDelegates.roadmapWeek === 'undefined' ||
    typeof cachedDelegates.roadmapTask === 'undefined' ||
    typeof cachedDelegates.roadmapReplanEvent === 'undefined')

if (!prismaClientFromCache || needsRefreshForSchemaChange) {
  globalForPrisma.prisma = prismaClientSingleton()
}

export const prisma = globalForPrisma.prisma as PrismaClientSingleton

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
