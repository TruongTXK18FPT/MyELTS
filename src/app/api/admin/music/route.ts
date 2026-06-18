import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin';
import { parseMusicUrl, fetchYouTubeOEmbed } from '@/lib/music-utils';

export async function GET() {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const tracks = await prisma.musicTrack.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        addedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Error fetching admin music tracks:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách bài hát.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'Đường dẫn URL bài hát là bắt buộc.' }, { status: 400 });
    }

    const parsed = parseMusicUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Đường dẫn không hợp lệ. Vui lòng nhập link YouTube hoặc Spotify.' },
        { status: 400 }
      );
    }

    const existing = await prisma.musicTrack.findFirst({
      where: { platformId: parsed.id, platform: parsed.platform },
    });

    if (existing) {
      return NextResponse.json({ error: 'Bài hát này đã được thêm vào hệ thống trước đó.' }, { status: 409 });
    }

    let title = 'Tiêu đề không rõ';
    let artist: string | null = null;

    if (parsed.platform === 'YOUTUBE') {
      const oembed = await fetchYouTubeOEmbed(url);
      if (oembed) {
        title = oembed.title;
        artist = oembed.author_name;
      }
    } else {
      title = 'Spotify Track';
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
        addedById: adminCheck.userId as string,
      },
      include: {
        addedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error('Error adding admin music track:', error);
    return NextResponse.json({ error: 'Không thể thêm bài hát.' }, { status: 500 });
  }
}
