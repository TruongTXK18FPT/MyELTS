import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// DELETE /api/music/tracks/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const track = await prisma.musicTrack.findUnique({ where: { id } });
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Only the user who added it can delete
    if (track.addedById !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this track' }, { status: 403 });
    }

    await prisma.musicTrack.delete({ where: { id } });

    return NextResponse.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json({ error: 'Failed to delete track' }, { status: 500 });
  }
}
