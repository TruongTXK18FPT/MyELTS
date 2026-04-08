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
    const body = await req.json();

    const inputTrackIds = [
      ...(typeof body.trackId === 'string' ? [body.trackId] : []),
      ...(Array.isArray(body.trackIds)
        ? body.trackIds.filter((value: unknown): value is string => typeof value === 'string')
        : []),
    ];
    const trackIds = Array.from(new Set(inputTrackIds));

    if (trackIds.length === 0) {
      return NextResponse.json({ error: 'At least one track ID is required' }, { status: 400 });
    }

    // Verify playlist exists
    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Verify tracks exist
    const existingTracks = await prisma.musicTrack.findMany({
      where: {
        id: {
          in: trackIds,
        },
      },
      select: { id: true },
    });
    if (existingTracks.length !== trackIds.length) {
      return NextResponse.json({ error: 'One or more tracks were not found' }, { status: 404 });
    }

    // Check which tracks are already in playlist
    const existingRelations = await prisma.playlistTrack.findMany({
      where: {
        playlistId: id,
        trackId: { in: trackIds },
      },
      select: { trackId: true },
    });
    const existingTrackIds = new Set(existingRelations.map((relation) => relation.trackId));
    const trackIdsToAdd = trackIds.filter((trackId) => !existingTrackIds.has(trackId));

    if (trackIdsToAdd.length === 0) {
      return NextResponse.json(
        {
          error:
            trackIds.length === 1
              ? 'Track already in playlist'
              : 'All selected tracks are already in playlist',
        },
        { status: 409 }
      );
    }

    // Get max order
    const maxOrder = await prisma.playlistTrack.findFirst({
      where: { playlistId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const startOrder = (maxOrder?.order ?? -1) + 1;
    const isBulkRequest = Array.isArray(body.trackIds) || trackIds.length > 1;

    if (!isBulkRequest && trackIdsToAdd.length === 1) {
      const playlistTrack = await prisma.playlistTrack.create({
        data: {
          playlistId: id,
          trackId: trackIdsToAdd[0],
          order: startOrder,
        },
        include: {
          track: true,
        },
      });

      return NextResponse.json(playlistTrack, { status: 201 });
    }

    await prisma.playlistTrack.createMany({
      data: trackIdsToAdd.map((trackId, index) => ({
        playlistId: id,
        trackId,
        order: startOrder + index,
      })),
    });

    const addedTracks = await prisma.playlistTrack.findMany({
      where: {
        playlistId: id,
        trackId: {
          in: trackIdsToAdd,
        },
      },
      include: {
        track: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(
      {
        addedCount: addedTracks.length,
        addedTracks,
        skippedCount: existingTrackIds.size,
      },
      { status: 201 }
    );
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
    const body = await req.json();

    const inputTrackIds = [
      ...(typeof body.trackId === 'string' ? [body.trackId] : []),
      ...(Array.isArray(body.trackIds)
        ? body.trackIds.filter((value: unknown): value is string => typeof value === 'string')
        : []),
    ];
    const trackIds = Array.from(new Set(inputTrackIds));

    if (trackIds.length === 0) {
      return NextResponse.json({ error: 'At least one track ID is required' }, { status: 400 });
    }

    const deleted = await prisma.playlistTrack.deleteMany({
      where: {
        playlistId: id,
        trackId: {
          in: trackIds,
        },
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Track not found in playlist' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Track removed from playlist',
      removedCount: deleted.count,
    });
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}
