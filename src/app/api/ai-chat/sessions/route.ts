import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { TUTOR_TYPES } from '@/lib/chat-utils';
import { getTutorDefinition } from '@/ai/tutor-config';

const querySchema = z.object({
  tutorType: z.enum(TUTOR_TYPES).optional(),
  archived: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value ? value === 'true' : undefined)),
});

const createSessionSchema = z.object({
  tutorType: z.enum(TUTOR_TYPES),
  title: z.string().trim().max(120).optional(),
});

function getPreview(content: string): string {
  const compact = content
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[\[\]()*_~#>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!compact) {
    return '';
  }

  return compact.length > 78 ? `${compact.slice(0, 75)}...` : compact;
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const params = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams.entries()));

    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: session.user.id,
        ...(params.tutorType ? { tutorType: params.tutorType } : {}),
        ...(typeof params.archived === 'boolean' ? { isArchived: params.archived } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          where: {
            role: 'USER',
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      sessions: sessions.map((item) => ({
        id: item.id,
        title: item.title,
        tutorType: item.tutorType,
        isArchived: item.isArchived,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        messageCount: item._count.messages,
        lastMessagePreview: item.messages[0]?.content ? getPreview(item.messages[0].content) : null,
        lastMessageRole: item.messages[0]?.role || null,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Truy vấn không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể tải danh sách phiên chat.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const payload = createSessionSchema.parse(await req.json());
    const tutor = getTutorDefinition(payload.tutorType);

    const created = await prisma.chatSession.create({
      data: {
        tutorType: payload.tutorType,
        userId: session.user.id,
        title: payload.title?.trim() || `New chat with ${tutor.name}`,
      },
    });

    return NextResponse.json(
      {
        session: {
          id: created.id,
          title: created.title,
          tutorType: created.tutorType,
          isArchived: created.isArchived,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          messageCount: 0,
          lastMessagePreview: null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể tạo phiên chat mới.' }, { status: 500 });
  }
}
