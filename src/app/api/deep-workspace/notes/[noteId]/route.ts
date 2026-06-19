import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { embedNote } from '@/ai/flows/note-embedding';

// GET /api/deep-workspace/notes/[noteId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: session.user.id },
    });

    if (!note) {
      return NextResponse.json({ error: 'Không tìm thấy ghi chú' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('GET /notes/[noteId] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PATCH /api/deep-workspace/notes/[noteId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;
    const body = await req.json();

    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy ghi chú' }, { status: 404 });
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.plainText !== undefined ? { plainText: body.plainText } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
        ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
        ...(body.dailyPlanId !== undefined ? { dailyPlanId: body.dailyPlanId } : {}),
      },
    });

    // Re-embed if content changed
    if (body.plainText !== undefined && body.plainText.length > 10) {
      embedNote(noteId).catch(err =>
        console.error('Note re-embedding error:', err)
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /notes/[noteId] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/deep-workspace/notes/[noteId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;

    await prisma.note.deleteMany({
      where: { id: noteId, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /notes/[noteId] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
