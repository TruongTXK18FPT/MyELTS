import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST /api/music/playlists/[id]/tracks - Add track to playlist
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { trackId } = await req.json();

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    // Verify playlist exists
    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Verify track exists
    const track = await prisma.musicTrack.findUnique({ where: { id: trackId } });
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Check if already in playlist
    const existing = await prisma.playlistTrack.findUnique({
      where: { playlistId_trackId: { playlistId: id, trackId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Track already in playlist' }, { status: 409 });
    }

    // Get max order
    const maxOrder = await prisma.playlistTrack.findFirst({
      where: { playlistId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId: id,
        trackId,
        order: (maxOrder?.order ?? -1) + 1,
      },
      include: {
        track: true,
      },
    });

    return NextResponse.json(playlistTrack, { status: 201 });
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return NextResponse.json({ error: 'Failed to add track to playlist' }, { status: 500 });
  }
}

// DELETE /api/music/playlists/[id]/tracks - Remove track from playlist
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
    const { trackId } = await req.json();

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    await prisma.playlistTrack.delete({
      where: { playlistId_trackId: { playlistId: id, trackId } },
    });

    return NextResponse.json({ message: 'Track removed from playlist' });
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}
