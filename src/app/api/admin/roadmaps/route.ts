import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const roadmaps = await prisma.roadmapPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        weeks: {
          include: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(roadmaps);
  } catch (error) {
    console.error('Error fetching admin roadmaps:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách lộ trình.' }, { status: 500 });
  }
}
