import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

import { auth } from '@/auth';
import { getListeningAudioAssetDelegate } from '@/lib/roadmap-delegate';

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để upload audio.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const attemptId = formData.get('attemptId');
    const sourceNote = formData.get('sourceNote');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Bạn cần gửi audio trong trường "file".' }, { status: 400 });
    }

    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File upload phải là audio.' }, { status: 400 });
    }

    const listeningAudioAsset = getListeningAudioAssetDelegate();

    if (!listeningAudioAsset) {
      return NextResponse.json(
        { error: 'Hệ thống upload audio chưa sẵn sàng. Vui lòng chạy lại prisma generate.' },
        { status: 503 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;
    const upload = await cloudinary.uploader.upload(fileBase64, {
      folder: 'myelts/listening/audio',
      resource_type: 'auto',
    });

    const created = await listeningAudioAsset.create({
      data: {
        userId: session.user.id,
        attemptId: typeof attemptId === 'string' && attemptId.trim() ? attemptId.trim() : null,
        url: upload.secure_url,
        filename: file.name || null,
        mimeType: file.type || null,
        size: file.size || null,
        durationSec: typeof upload.duration === 'number' ? Math.round(upload.duration) : null,
        sourceNote: typeof sourceNote === 'string' && sourceNote.trim() ? sourceNote.trim() : null,
      },
      select: {
        id: true,
        url: true,
        filename: true,
        mimeType: true,
        size: true,
        durationSec: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      asset: {
        ...created,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể upload audio Listening lúc này.' }, { status: 500 });
  }
}
