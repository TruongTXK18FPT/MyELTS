import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { embedNote } from '@/ai/flows/note-embedding';

// GET /api/deep-workspace/notes - List notes
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const dailyPlanId = searchParams.get('dailyPlanId');
    const pinned = searchParams.get('pinned');

    const where: Record<string, unknown> = { userId: session.user.id };
    if (date) where.date = new Date(date);
    if (dailyPlanId) where.dailyPlanId = dailyPlanId;
    if (pinned === 'true') where.isPinned = true;

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      take: 50,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('GET /notes error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/deep-workspace/notes - Create note
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, plainText, tags, dailyPlanId, date } = body;

    if (!title) {
      return NextResponse.json({ error: 'Tiêu đề là bắt buộc' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        userId: session.user.id,
        title,
        content: content || { blocks: [] },
        plainText: plainText || '',
        tags: tags || [],
        dailyPlanId: dailyPlanId || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    // Embed note in background (don't await for faster response)
    if (plainText && plainText.length > 10) {
      embedNote(note.id).catch(err =>
        console.error('Note embedding error:', err)
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('POST /notes error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
