import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/deep-workspace/reviews - Lấy danh sách ôn tập (phân loại đến hạn và sắp tới)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');

    // Nếu truyền noteId, kiểm tra trạng thái ôn tập của riêng note này
    if (noteId) {
      const review = await prisma.spacedReview.findFirst({
        where: {
          userId: session.user.id,
          noteId,
        },
      });
      return NextResponse.json(review);
    }

    const now = new Date();

    // Lấy tất cả mục ôn tập
    const allReviews = await prisma.spacedReview.findMany({
      where: { userId: session.user.id },
      include: {
        note: {
          select: {
            title: true,
            plainText: true,
            tags: true,
          },
        },
      },
      orderBy: { nextReviewAt: 'asc' },
    });

    const due = allReviews.filter((r) => new Date(r.nextReviewAt) <= now);
    const upcoming = allReviews.filter((r) => new Date(r.nextReviewAt) > now);

    return NextResponse.json({ due, upcoming, all: allReviews });
  } catch (error) {
    console.error('GET /api/deep-workspace/reviews error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/deep-workspace/reviews - Thêm một ghi chú hoặc chủ đề vào ôn tập ngắt quãng
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { noteId, title } = body;

    if (!title) {
      return NextResponse.json({ error: 'Tiêu đề là bắt buộc' }, { status: 400 });
    }

    // Kiểm tra xem đã tồn tại chưa
    if (noteId) {
      const existing = await prisma.spacedReview.findFirst({
        where: {
          userId: session.user.id,
          noteId,
        },
      });

      if (existing) {
        return NextResponse.json(existing);
      }
    }

    const newReview = await prisma.spacedReview.create({
      data: {
        userId: session.user.id,
        noteId: noteId || null,
        title,
        box: 1,
        intervalDays: 1,
        nextReviewAt: new Date(), // Ôn tập ngay lập tức
      },
    });

    return NextResponse.json(newReview);
  } catch (error) {
    console.error('POST /api/deep-workspace/reviews error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
