import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/deep-workspace/dashboard - Aggregate dashboard data
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Plans stats
    const [totalPlans, activePlans, completedPlans] = await Promise.all([
      prisma.deepPlan.count({ where: { userId } }),
      prisma.deepPlan.count({ where: { userId, status: { in: ['APPROVED', 'IN_PROGRESS'] } } }),
      prisma.deepPlan.count({ where: { userId, status: 'COMPLETED' } }),
    ]);

    // Tasks stats
    const allTasks = await prisma.planTask2.findMany({
      where: { dailyPlan: { userId } },
      select: { status: true },
    });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const pendingTasks = allTasks.filter(t => t.status === 'TODO').length;

    // Notes stats
    const totalNotes = await prisma.note.count({ where: { userId } });

    // Recent daily plans for streak calculation
    const recentDailyPlans = await prisma.dailyPlan.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
      select: { date: true, completionRate: true },
    });

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < recentDailyPlans.length; i++) {
      const planDate = new Date(recentDailyPlans[i].date);
      planDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (planDate.getTime() === expectedDate.getTime() && recentDailyPlans[i].completionRate >= 50) {
        streak++;
      } else {
        break;
      }
    }

    // Weekly completion data (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyData = await prisma.dailyPlan.findMany({
      where: {
        userId,
        date: { gte: fourWeeksAgo },
      },
      select: { date: true, completionRate: true },
      orderBy: { date: 'asc' },
    });

    // Pending tasks (not completed, with plan approved)
    const pendingTasksList = await prisma.planTask2.findMany({
      where: {
        dailyPlan: {
          userId,
          deepPlan: { status: { in: ['APPROVED', 'IN_PROGRESS'] } },
        },
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
      include: {
        dailyPlan: { select: { date: true } },
      },
      orderBy: { dailyPlan: { date: 'asc' } },
      take: 10,
    });

    // --- ACTIVITY HEATMAP (Last 90 days) ---
    const heatmapLimitDate = new Date();
    heatmapLimitDate.setDate(heatmapLimitDate.getDate() - 90);

    const [tasksCompleted, notesCreated] = await Promise.all([
      prisma.planTask2.findMany({
        where: {
          dailyPlan: { userId },
          status: 'COMPLETED',
          completedAt: { gte: heatmapLimitDate },
        },
        select: { completedAt: true },
      }),
      prisma.note.findMany({
        where: {
          userId,
          createdAt: { gte: heatmapLimitDate },
        },
        select: { createdAt: true },
      }),
    ]);

    const activityMap: Record<string, number> = {};
    tasksCompleted.forEach(t => {
      if (t.completedAt) {
        const dateStr = t.completedAt.toISOString().split('T')[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      }
    });
    notesCreated.forEach(n => {
      const dateStr = n.createdAt.toISOString().split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });

    const heatmapData = Object.entries(activityMap).map(([date, count]) => ({
      date,
      count,
    }));

    // --- KNOWLEDGE GRAPH DATA ---
    const tasksByArea = await prisma.planTask2.groupBy({
      by: ['knowledgeArea'],
      where: { dailyPlan: { userId } },
      _count: { _all: true },
    });

    const notesByTag = await prisma.note.findMany({
      where: { userId },
      select: { tags: true },
    });

    const tagCounts: Record<string, number> = {};
    notesByTag.forEach(n => {
      n.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const nodes: { id: string; group: number; val: number }[] = [];
    const links: { source: string; target: string; value: number }[] = [];

    // Base main node
    nodes.push({ id: 'Workspace', group: 1, val: 20 });

    tasksByArea.forEach(t => {
      if (t.knowledgeArea) {
        nodes.push({ id: t.knowledgeArea, group: 2, val: t._count._all + 4 });
        links.push({ source: 'Workspace', target: t.knowledgeArea, value: 2 });
      }
    });

    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (!nodes.some(n => n.id === tag)) {
        nodes.push({ id: tag, group: 3, val: count + 3 });
        links.push({ source: 'Workspace', target: tag, value: 1 });
      }
    });

    // Fetch real IELTS performance metrics from Prisma
    const latestDiagnostic = await prisma.diagnosticResult.findFirst({
      where: { userId },
      orderBy: { takenAt: 'desc' },
      select: {
        overallBand: true,
        listeningBand: true,
        readingBand: true,
        writingBand: true,
        speakingBand: true,
        takenAt: true,
      },
    });

    const totalAttempts = await prisma.diagnosticAttempt.count({
      where: { userId, status: 'SUBMITTED' },
    });

    const totalVocab = await prisma.vocab.count({
      where: { userId },
    });

    const completedGrammar = await prisma.grammarStudyProgress.count({
      where: { userId, isCompleted: true },
    });

    const latestRoadmap = await prisma.roadmapPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { targetBandScore: true },
    });
    const targetBand = latestRoadmap?.targetBandScore ?? 7.5;

    return NextResponse.json({
      plans: { total: totalPlans, active: activePlans, completed: completedPlans },
      tasks: { total: totalTasks, completed: completedTasks, inProgress: inProgressTasks, pending: pendingTasks },
      notes: { total: totalNotes },
      streak,
      weeklyData: weeklyData.map(d => ({
        date: d.date.toISOString().split('T')[0],
        completionRate: d.completionRate,
      })),
      pendingTasks: pendingTasksList.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        knowledgeArea: t.knowledgeArea,
        date: t.dailyPlan.date.toISOString().split('T')[0],
      })),
      heatmapData,
      knowledgeGraph: { nodes, links },
      ielts: {
        hasDiagnostic: !!latestDiagnostic,
        overallBand: latestDiagnostic?.overallBand ?? null,
        listeningBand: latestDiagnostic?.listeningBand ?? null,
        readingBand: latestDiagnostic?.readingBand ?? null,
        writingBand: latestDiagnostic?.writingBand ?? null,
        speakingBand: latestDiagnostic?.speakingBand ?? null,
        takenAt: latestDiagnostic?.takenAt ? latestDiagnostic.takenAt.toISOString() : null,
        targetBand,
        totalAttempts,
        totalVocab,
        completedGrammar,
      },
    });
  } catch (error) {
    console.error('GET /dashboard error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
