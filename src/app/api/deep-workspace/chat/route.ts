import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { chatCompletion, type MistralMessage } from '@/lib/mistral';
import { searchNotesBySimilarity } from '@/ai/flows/note-embedding';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Tin nhắn không hợp lệ' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;

    // 1. Lấy context từ ghi chú (Vector Search)
    let noteContext = '';
    try {
      const relevantChunks = await searchNotesBySimilarity(session.user.id, lastMessage, 4);
      if (relevantChunks && relevantChunks.length > 0) {
        noteContext = relevantChunks
          .filter((rc) => rc.similarity > 0.3)
          .map((rc) => rc.chunkText)
          .join('\n---\n');
      }
    } catch (e) {
      console.warn('Vector search failed in chat API, falling back...', e);
      // Fallback: Lấy 3 notes mới nhất của user
      const recentNotes = await prisma.note.findMany({
        where: { userId: session.user.id },
        orderBy: { date: 'desc' },
        take: 3,
        select: { title: true, plainText: true },
      });
      noteContext = recentNotes
        .map((n) => `Ghi chú "${n.title}": ${n.plainText?.slice(0, 300)}...`)
        .join('\n---\n');
    }

    // 2. Lấy context từ kế hoạch hiện tại
    const activePlan = await prisma.deepPlan.findFirst({
      where: {
        userId: session.user.id,
        status: 'APPROVED',
      },
      include: {
        dailyPlans: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          take: 3,
          include: {
            tasks: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    let planContext = 'Không có kế hoạch học tập nào đang active.';
    if (activePlan) {
      planContext = `Kế hoạch hiện tại: "${activePlan.title}" (${activePlan.topic})
Mục tiêu/mô tả: ${activePlan.description || 'Không có'}
Lịch trình các ngày sắp tới:
` + activePlan.dailyPlans.map((dp, i) => {
        const dateStr = new Date(dp.date).toLocaleDateString('vi-VN');
        const tasksStr = dp.tasks.map((t) => `- ${t.title} [${t.status}] (${t.estimatedMinutes} phút)`).join('\n');
        return `Ngày ${i + 1} (${dateStr}):\n${tasksStr}`;
      }).join('\n\n');
    }

    // 3. Xây dựng prompt cho Mistral AI
    const systemPrompt = `Bạn là trợ lý học tập đồng hành (AI Companion) thông minh và thân thiện trong không gian học tập Deep Workspace của người dùng tại MyELTS.
Nhiệm vụ của bạn là giải thích kiến thức, ôn tập, hỗ trợ giải đáp thắc mắc của người dùng dựa trên thông tin thực tế từ kế hoạch học tập và các ghi chú của họ.

Dưới đây là các ngữ cảnh thực tế của người dùng:

[KẾ HOẠCH HỌC TẬP HIỆN TẠI]
${planContext}

[GHI CHÚ HỌC TẬP LIÊN QUAN] (Được tìm kiếm tự động dựa trên câu hỏi của người dùng)
${noteContext || 'Chưa tìm thấy ghi chú nào liên quan.'}

HƯỚNG DẪN TRẢ LỜI:
- Luôn trả lời bằng TIẾNG VIỆT tự nhiên, thân thiện và mang tính khích lệ học tập cao.
- Trả lời trực tiếp, rõ ràng. Nếu cần giải thích code, hãy sử dụng các block code định dạng Markdown.
- Thường xuyên khuyên khích người dùng liên kết kiến thức mới với các ghi chú họ đã ghi, hoặc nhắc nhở họ sử dụng đồng hồ Pomodoro ở thanh bên để thực hiện các nhiệm vụ trong ngày.
- Hãy hành xử như một người đồng hành thực thụ, nắm rõ những gì họ đang học để đưa ra lời khuyên sát sườn nhất.`;

    const mistralMessages: MistralMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: 'user' | 'assistant'; content: string }) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      })),
    ];

    const reply = await chatCompletion(mistralMessages, {
      model: 'mistral-large-latest',
      temperature: 0.7,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('POST /api/deep-workspace/chat error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
