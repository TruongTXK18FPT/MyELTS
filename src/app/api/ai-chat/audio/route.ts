import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MISTRAL_STT_MODEL } from '@/ai/tutor-config';

const mistralTranscribeEndpoint = 'https://api.mistral.ai/v1/audio/transcriptions';

function pickTranscript(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.text === 'string') {
    return record.text;
  }

  if (typeof record.transcript === 'string') {
    return record.transcript;
  }

  if (record.data && typeof record.data === 'object') {
    const data = record.data as Record<string, unknown>;
    if (typeof data.text === 'string') {
      return data.text;
    }
  }

  return '';
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('audio');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Bạn cần gửi tệp audio trong trường "audio".' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Thiếu MISTRAL_API_KEY. Bạn có thể dùng Web Speech API trực tiếp trên trình duyệt để thay thế.',
        },
        { status: 500 }
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.set('model', MISTRAL_STT_MODEL);
    upstreamForm.set('file', file, file.name || 'recording.webm');

    const response = await fetch(mistralTranscribeEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamForm,
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok || !payload) {
      console.error('Mistral STT error:', payload);
      return NextResponse.json({ error: 'Không thể chuyển giọng nói sang văn bản lúc này.' }, { status: 502 });
    }

    const transcript = pickTranscript(payload).trim();

    if (!transcript) {
      return NextResponse.json({ error: 'Không nhận diện được nội dung giọng nói.' }, { status: 422 });
    }

    return NextResponse.json({
      transcript,
      model: MISTRAL_STT_MODEL,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Không thể xử lý audio upload.' }, { status: 500 });
  }
}
