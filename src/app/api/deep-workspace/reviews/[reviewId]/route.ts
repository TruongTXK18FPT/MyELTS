import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Leitner system intervals in days
const BOX_INTERVALS = [1, 3, 7, 14, 30];

// PATCH /api/deep-workspace/reviews/[reviewId] - Ghi nhận kết quả ôn tập (cập nhật Leitner box)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId } = await params;
    const body = await req.json();
    const { rating } = body; // 'easy' | 'medium' | 'hard'

    if (!rating || !['easy', 'medium', 'hard'].includes(rating)) {
      return NextResponse.json({ error: 'Đánh giá không hợp lệ' }, { status: 400 });
    }

    const review = await prisma.spacedReview.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== session.user.id) {
      return NextResponse.json({ error: 'Không tìm thấy mục ôn tập' }, { status: 404 });
    }

    let nextBox = review.box;
    let intervalDays = review.intervalDays;

    if (rating === 'easy') {
      nextBox = Math.min(5, review.box + 1);
      intervalDays = BOX_INTERVALS[nextBox - 1];
    } else if (rating === 'medium') {
      // Giữ nguyên box, giữ nguyên khoảng cách
      intervalDays = BOX_INTERVALS[nextBox - 1];
    } else if (rating === 'hard') {
      nextBox = 1; // Reset về Box 1
      intervalDays = 1;
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

    const updated = await prisma.spacedReview.update({
      where: { id: reviewId },
      data: {
        box: nextBox,
        intervalDays,
        nextReviewAt,
        lastReviewedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/deep-workspace/reviews/[reviewId] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/deep-workspace/reviews/[reviewId] - Xóa mục ôn tập
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId } = await params;

    const review = await prisma.spacedReview.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== session.user.id) {
      return NextResponse.json({ error: 'Không tìm thấy mục ôn tập' }, { status: 404 });
    }

    await prisma.spacedReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/deep-workspace/reviews/[reviewId] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
