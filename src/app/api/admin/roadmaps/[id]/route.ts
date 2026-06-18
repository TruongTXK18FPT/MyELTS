import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin';

type RouteParams = { id: string };
type RouteContext = { params: Promise<RouteParams> };

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await context.params;

    const target = await prisma.roadmapPlan.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'Không tìm thấy lộ trình học để xóa.' }, { status: 404 });
    }

    await prisma.roadmapPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Lộ trình học đã được xóa thành công.' });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    return NextResponse.json({ error: 'Không thể xóa lộ trình học.' }, { status: 500 });
  }
}
