import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      newUsersWeekly,
      totalVocabs,
      newVocabsWeekly,
      totalGrammar,
      totalRoadmaps,
      activeRoadmaps,
      totalMusicTracks,
      usersByRole,
      grammarByLevel,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.vocab.count(),
      prisma.vocab.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.grammarEntry.count(),
      prisma.roadmapPlan.count(),
      prisma.roadmapPlan.count({ where: { status: 'ACTIVE' } }),
      prisma.musicTrack.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
      prisma.grammarEntry.groupBy({
        by: ['level'],
        _count: { _all: true },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Format charts data (for registrations over last 7 days)
    const registrationsChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      registrationsChart.push({
        date: startOfDay.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }),
        count,
      });
    }

    return NextResponse.json({
      summary: {
        totalUsers,
        newUsersWeekly,
        totalVocabs,
        newVocabsWeekly,
        totalGrammar,
        totalRoadmaps,
        activeRoadmaps,
        totalMusicTracks,
      },
      breakdown: {
        usersByRole: usersByRole.map((u: any) => ({ name: u.role || 'USER', value: u._count?._all || 0 })),
        grammarByLevel: grammarByLevel.map((g: any) => ({ name: g.level || 'Chưa phân loại', value: g._count?._all || 0 })),
      },
      charts: {
        registrations: registrationsChart,
      },
      recentUsers,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Không thể lấy dữ liệu thống kê.' }, { status: 500 });
  }
}
