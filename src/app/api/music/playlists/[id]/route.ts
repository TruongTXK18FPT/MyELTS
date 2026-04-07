import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/music/playlists/[id] - Get playlist details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, image: true, avatar: true },
        },
        tracks: {
          include: {
            track: {
              include: {
                addedBy: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

// PUT /api/music/playlists/[id] - Update playlist
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, description, coverImage } = await req.json();

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
    if (playlist.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updated = await prisma.playlist.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(coverImage !== undefined && { coverImage: coverImage || null }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, image: true, avatar: true },
        },
        tracks: {
          include: { track: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { tracks: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

// DELETE /api/music/playlists/[id]
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

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
    if (playlist.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.playlist.delete({ where: { id } });

    return NextResponse.json({ message: 'Playlist deleted' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
