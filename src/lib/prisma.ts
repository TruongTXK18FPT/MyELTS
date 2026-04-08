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
}

const needsRefreshForSchemaChange =
  process.env.NODE_ENV !== 'production' &&
  prismaClientFromCache &&
  (typeof cachedDelegates.grammarEntry === 'undefined' ||
    typeof cachedDelegates.grammarStudyProgress === 'undefined')

if (!prismaClientFromCache || needsRefreshForSchemaChange) {
  globalForPrisma.prisma = prismaClientSingleton()
}

export const prisma = globalForPrisma.prisma as PrismaClientSingleton

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
