import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/music/playlists - Get all playlists
export async function GET() {
  try {
    const playlists = await prisma.playlist.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, image: true, avatar: true },
        },
        tracks: {
          include: {
            track: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { tracks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

// POST /api/music/playlists - Create a new playlist
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, coverImage } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        coverImage: coverImage || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, image: true, avatar: true },
        },
        tracks: {
          include: { track: true },
        },
        _count: {
          select: { tracks: true },
        },
      },
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
