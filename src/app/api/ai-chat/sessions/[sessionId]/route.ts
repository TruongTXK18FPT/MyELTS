import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type RouteParams = { sessionId: string };
type RouteContext = { params: Promise<RouteParams> };

const updateSessionSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((payload) => typeof payload.title !== 'undefined' || typeof payload.isArchived !== 'undefined', {
    message: 'Không có dữ liệu cần cập nhật.',
  });

async function getSessionId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.sessionId;
}

async function verifyOwnership(userId: string, sessionId: string) {
  return prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const sessionId = await getSessionId(context);

    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Không tìm thấy phiên chat.' }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: chatSession.id,
        title: chatSession.title,
        tutorType: chatSession.tutorType,
        isArchived: chatSession.isArchived,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
      },
      messages: chatSession.messages,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể tải chi tiết phiên chat.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const sessionId = await getSessionId(context);
    const ownedSession = await verifyOwnership(session.user.id, sessionId);

    if (!ownedSession) {
      return NextResponse.json({ error: 'Không tìm thấy phiên chat.' }, { status: 404 });
    }

    const payload = updateSessionSchema.parse(await req.json());

    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        ...(typeof payload.title !== 'undefined' ? { title: payload.title } : {}),
        ...(typeof payload.isArchived === 'boolean' ? { isArchived: payload.isArchived } : {}),
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu cập nhật không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể cập nhật phiên chat.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const sessionId = await getSessionId(context);

    const deleted = await prisma.chatSession.deleteMany({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Không tìm thấy phiên chat để xóa.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể xóa phiên chat.' }, { status: 500 });
  }
}
