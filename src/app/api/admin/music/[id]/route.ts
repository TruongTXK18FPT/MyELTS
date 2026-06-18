import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin';

type RouteParams = { id: string };
type RouteContext = { params: Promise<RouteParams> };

export async function PUT(req: Request, context: RouteContext) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { title, artist, url, thumbnail } = body;

    const target = await prisma.musicTrack.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'Không tìm thấy bài hát để cập nhật.' }, { status: 404 });
    }

    const updated = await prisma.musicTrack.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        artist: artist !== undefined ? artist : undefined,
        url: url !== undefined ? url : undefined,
        thumbnail: thumbnail !== undefined ? thumbnail : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating music track:', error);
    return NextResponse.json({ error: 'Không thể cập nhật bài hát.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await context.params;

    const target = await prisma.musicTrack.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'Không tìm thấy bài hát để xóa.' }, { status: 404 });
    }

    await prisma.musicTrack.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Bài hát đã được xóa.' });
  } catch (error) {
    console.error('Error deleting music track:', error);
    return NextResponse.json({ error: 'Không thể xóa bài hát.' }, { status: 500 });
  }
}
