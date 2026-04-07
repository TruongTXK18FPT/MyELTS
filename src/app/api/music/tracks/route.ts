import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { parseMusicUrl, fetchYouTubeOEmbed } from '@/lib/music-utils';

// GET /api/music/tracks - Get all tracks
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = platform ? { platform: platform as 'YOUTUBE' | 'SPOTIFY' } : {};

    const [tracks, total] = await Promise.all([
      prisma.musicTrack.findMany({
        where,
        include: {
          addedBy: {
            select: { id: true, name: true, image: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.musicTrack.count({ where }),
    ]);

    return NextResponse.json({
      tracks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}

// POST /api/music/tracks - Add a new track
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const parsed = parseMusicUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid URL. Please provide a valid YouTube or Spotify link.' },
        { status: 400 }
      );
    }

    // Check if track already exists
    const existing = await prisma.musicTrack.findFirst({
      where: { platformId: parsed.id, platform: parsed.platform },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'This track has already been added!' },
        { status: 409 }
      );
    }

    // Fetch metadata
    let title = 'Unknown Title';
    let artist: string | null = null;

    if (parsed.platform === 'YOUTUBE') {
      const oembed = await fetchYouTubeOEmbed(url);
      if (oembed) {
        title = oembed.title;
        artist = oembed.author_name;
      }
    } else {
      title = `Spotify Track`;
      artist = null;
    }

    const track = await prisma.musicTrack.create({
      data: {
        title,
        url,
        platform: parsed.platform,
        platformId: parsed.id,
        thumbnail: parsed.thumbnailUrl,
        artist,
        addedById: session.user.id,
      },
      include: {
        addedBy: {
          select: { id: true, name: true, image: true, avatar: true },
        },
      },
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error('Error adding track:', error);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
  }
}
