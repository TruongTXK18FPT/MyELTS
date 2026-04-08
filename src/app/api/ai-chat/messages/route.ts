import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  DEFAULT_CHAT_CONTEXT_LIMIT,
  MESSAGE_CONTENT_TYPES,
  TUTOR_TYPES,
  buildSessionTitleFromMessage,
} from '@/lib/chat-utils';
import { CHAT_MODEL_DEFAULT, CHAT_MODEL_WRITING_EVAL, getTutorDefinition } from '@/ai/tutor-config';

type MistralChoice = {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
};

type MistralResponse = {
  choices?: MistralChoice[];
};

const mistralEndpoint = 'https://api.mistral.ai/v1/chat/completions';

const createMessageSchema = z.object({
  sessionId: z.string().trim().min(1),
  content: z.string().trim().min(1).max(12000),
  contentType: z.enum(MESSAGE_CONTENT_TYPES).optional().default('TEXT'),
  metadata: z.record(z.unknown()).optional(),
  audioUrl: z.string().trim().url().nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  contextLimit: z.coerce.number().int().min(6).max(40).optional(),
});

const assistantContentTypes = ['TEXT', 'ESSAY_EVALUATION', 'LISTENING_EXERCISE', 'READING_PASSAGE', 'SPEAKING_FEEDBACK'] as const;
type AssistantContentType = (typeof assistantContentTypes)[number];

type NormalizedAssistantPayload = {
  response: string;
  contentType: AssistantContentType;
  metadata: Record<string, unknown>;
  youtubeLinks: string[];
};

function asJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

function extractMessageContent(payload: MistralResponse): string {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }

  return '';
}

function extractJsonText(rawContent: string): string {
  const trimmed = rawContent.trim();

  const withoutCodeFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const startIndex = withoutCodeFence.indexOf('{');
  const endIndex = withoutCodeFence.lastIndexOf('}');

  if (startIndex >= 0 && endIndex > startIndex) {
    return withoutCodeFence.slice(startIndex, endIndex + 1);
  }

  return withoutCodeFence;
}

function pickModelForMessage(tutorType: (typeof TUTOR_TYPES)[number], text: string): string {
  if (tutorType === 'WRITING_TASK1' || tutorType === 'WRITING_TASK2') {
    if (/evaluate|band|score|chấm|đánh giá|feedback/i.test(text)) {
      return CHAT_MODEL_WRITING_EVAL;
    }
  }

  return CHAT_MODEL_DEFAULT;
}

function normalizeLinks(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        if (typeof record.url === 'string') {
          return record.url.trim();
        }
        if (typeof record.link === 'string') {
          return record.link.trim();
        }
        if (typeof record.href === 'string') {
          return record.href.trim();
        }
      }

      return '';
    })
    .filter((item) => /^https?:\/\//.test(item))
    .slice(0, 4);
}

function normalizeAssistantPayload(
  value: unknown,
  fallbackType: AssistantContentType,
  fallbackText: string
): NormalizedAssistantPayload {
  const fallbackResponse = fallbackText.trim() || 'Mình vẫn đang ở đây để hỗ trợ bạn nhé. Bạn gửi lại giúp mình một lần nha.';

  if (!value || typeof value !== 'object') {
    return {
      response: fallbackResponse,
      contentType: fallbackType,
      metadata: {},
      youtubeLinks: [],
    };
  }

  const raw = value as Record<string, unknown>;

  const response =
    typeof raw.response === 'string' && raw.response.trim()
      ? raw.response.trim()
      : typeof raw.feedback === 'string' && raw.feedback.trim()
      ? raw.feedback.trim()
      : fallbackResponse;

  const contentType =
    typeof raw.contentType === 'string' && assistantContentTypes.includes(raw.contentType as AssistantContentType)
      ? (raw.contentType as AssistantContentType)
      : fallbackType;

  const metadata = raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)
    ? (raw.metadata as Record<string, unknown>)
    : {};

  const youtubeLinks = normalizeLinks(raw.youtubeLinks || metadata.youtubeLinks);

  return {
    response,
    contentType,
    metadata,
    youtubeLinks,
  };
}

function normalizeFallbackContentType(value: string): AssistantContentType {
  if (assistantContentTypes.includes(value as AssistantContentType)) {
    return value as AssistantContentType;
  }

  return 'TEXT';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isReadingTutor(type: (typeof TUTOR_TYPES)[number]): boolean {
  return type === 'READING_ACADEMIC' || type === 'READING_GENERAL';
}

function normalizeAnswerKey(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
      .join('\n')
      .trim();
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, itemValue]) => `${key}: ${typeof itemValue === 'string' ? itemValue : JSON.stringify(itemValue)}`)
      .join('\n')
      .trim();
  }

  return '';
}

function looksLikeReadingAnswerSubmission(text: string): boolean {
  const normalized = text.toLowerCase();

  if (/\b(my answers?|my response|đáp án của tôi|câu trả lời của tôi)\b/i.test(normalized)) {
    return true;
  }

  if (/(?:^|\n)\s*(?:q(?:uestion)?\s*)?\d{1,2}\s*[:.)-]\s*\S+/im.test(text)) {
    return true;
  }

  if (/(?:^|\n)\s*\d{1,2}\s*[:.)-]\s*[a-e]\b/im.test(text)) {
    return true;
  }

  return false;
}

type ReadingWorkflowState = {
  awaitingLearnerAnswers: boolean;
  hiddenAnswerKey: string;
};

function getLatestReadingWorkflowState(
  messages: Array<{ role: string; contentType: string; metadata: unknown }>
): ReadingWorkflowState {
  for (const item of messages) {
    if (item.role !== 'ASSISTANT' || item.contentType !== 'READING_PASSAGE') {
      continue;
    }

    const metadata = asRecord(item.metadata);
    if (!metadata) {
      continue;
    }

    const hiddenAnswerKey = normalizeAnswerKey(metadata.hiddenAnswerKey || metadata.answerKey);
    const awaitingLearnerAnswers = metadata.awaitingLearnerAnswers === true;

    if (hiddenAnswerKey || awaitingLearnerAnswers) {
      return {
        awaitingLearnerAnswers,
        hiddenAnswerKey,
      };
    }
  }

  return {
    awaitingLearnerAnswers: false,
    hiddenAnswerKey: '',
  };
}

function stripReadingAnswerSection(markdown: string): {
  contentWithoutAnswers: string;
  extractedAnswerKey: string;
  removed: boolean;
} {
  const lines = markdown.split('\n');
  if (lines.length === 0) {
    return {
      contentWithoutAnswers: markdown,
      extractedAnswerKey: '',
      removed: false,
    };
  }

  const answerHeaderRegex = /^\s*(?:---\s*)?(?:#{1,6}\s*)?(?:answers?|answer\s*key|đáp\s*án)\b[:\s-]*/i;
  const boldAnswerHeaderRegex = /^\s*\*\*(?:answers?|answer\s*key|đáp\s*án)\*\*\s*:?\s*$/i;

  let start = -1;
  let headingLevel: number | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      continue;
    }

    if (answerHeaderRegex.test(trimmed) || boldAnswerHeaderRegex.test(trimmed)) {
      start = i;
      const headingMatch = trimmed.match(/^#{1,6}/);
      headingLevel = headingMatch ? headingMatch[0].length : null;
      break;
    }
  }

  if (start === -1) {
    return {
      contentWithoutAnswers: markdown,
      extractedAnswerKey: '',
      removed: false,
    };
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      continue;
    }

    const nextHeadingMatch = trimmed.match(/^#{1,6}\s+/);
    if (nextHeadingMatch) {
      const nextLevel = nextHeadingMatch[0].trim().length;
      if (headingLevel === null || nextLevel <= headingLevel) {
        end = i;
        break;
      }
    }
  }

  const extractedAnswerKey = lines.slice(start, end).join('\n').trim();
  const contentWithoutAnswers = [...lines.slice(0, start), ...lines.slice(end)]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    contentWithoutAnswers,
    extractedAnswerKey,
    removed: true,
  };
}

function buildStreamingResponse(text: string, donePayload: Record<string, unknown>): Response {
  const encoder = new TextEncoder();

  const chunks = text.match(/.{1,28}(?:\s|$)/g) || [text];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ delta: chunk })}\n\n`));
      }

      controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify(donePayload)}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }

    const payload = createMessageSchema.parse(await req.json());

    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        tutorType: true,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Không tìm thấy phiên chat.' }, { status: 404 });
    }

    const tutorType = z.enum(TUTOR_TYPES).parse(chatSession.tutorType);
    const tutor = getTutorDefinition(tutorType);

    const createdUserMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'USER',
        content: payload.content,
        contentType: payload.contentType,
        metadata: asJsonValue(payload.metadata),
        audioUrl: payload.audioUrl || null,
        imageUrl: payload.imageUrl || null,
      },
    });

    const contextLimit = payload.contextLimit || DEFAULT_CHAT_CONTEXT_LIMIT;

    const latestMessages = await prisma.chatMessage.findMany({
      where: {
        sessionId: chatSession.id,
      },
      orderBy: { createdAt: 'desc' },
      take: contextLimit,
    });

    const readingWorkflowState = getLatestReadingWorkflowState(
      latestMessages.map((item) => ({
        role: item.role,
        contentType: item.contentType,
        metadata: item.metadata,
      }))
    );

    const isReadingMode = isReadingTutor(tutorType);
    const learnerSubmittedReadingAnswers = looksLikeReadingAnswerSubmission(payload.content);
    const holdBackReadingAnswers = isReadingMode && !learnerSubmittedReadingAnswers;

    const contextualMessages = latestMessages.reverse().map((item) => {
      const role = item.role === 'USER' ? 'user' : item.role === 'ASSISTANT' ? 'assistant' : 'system';

      const metadata = asRecord(item.metadata);
      const hiddenAnswerKey = normalizeAnswerKey(metadata?.hiddenAnswerKey || metadata?.answerKey);
      const awaitingLearnerAnswers = metadata?.awaitingLearnerAnswers === true;

      const readingWorkflowHint =
        item.role === 'ASSISTANT' && item.contentType === 'READING_PASSAGE' && hiddenAnswerKey
          ? `\n[internal_reading_workflow]\nawaitingLearnerAnswers=${awaitingLearnerAnswers ? 'true' : 'false'}\nhiddenAnswerKey:\n${hiddenAnswerKey}`
          : '';

      if (item.contentType === 'TEXT') {
        return {
          role,
          content: `${item.content}${readingWorkflowHint}`,
        };
      }

      return {
        role,
        content: `[contentType=${item.contentType}]\n${item.content}${readingWorkflowHint}`,
      };
    });

    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Thiếu MISTRAL_API_KEY trong biến môi trường. Vui lòng cập nhật .env.local.' },
        { status: 500 }
      );
    }

    const languagePreference =
      payload.metadata && typeof payload.metadata.languagePreference === 'string'
        ? payload.metadata.languagePreference
        : 'auto';

    const languageInstruction =
      languagePreference === 'vi'
        ? '- Reply in Vietnamese.'
        : languagePreference === 'en'
        ? '- Reply in English.'
        : '- Detect user language (Vietnamese or English) and reply in the same language.';

    const model = pickModelForMessage(tutorType, payload.content);

    let provider: 'gemini' | 'mistral' = 'mistral';
    let modelUsed = model;
    let parsedJson: unknown = null;
    let rawContent = '';

    if (process.env.GOOGLE_GENAI_API_KEY && process.env.AI_CHAT_PROVIDER !== 'mistral') {
      try {
        const geminiOutput = await tutor.flow({
          message: payload.content,
          history: contextualMessages.map((item) => ({
            role: item.role as 'user' | 'assistant' | 'system',
            content: item.content,
          })),
        });

        parsedJson = geminiOutput;
        provider = 'gemini';
        modelUsed = 'googleai/gemini-2.5-flash';
      } catch (geminiError) {
        console.error('Gemini fallback triggered due to error:', geminiError);
      }
    }

    if (!parsedJson) {
      const aiResponse = await fetch(mistralEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.35,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `${tutor.systemPrompt}

Runtime constraints:
- Respect the selected tutor persona and expertise.
- Support bilingual learners (English and Vietnamese).
${languageInstruction}
- When generating IELTS prompts, passages, cue cards, mock tests, or question sets, default that generated task content to English unless the learner explicitly requests Vietnamese.
- For reading practice workflows, NEVER reveal the official answer key before the learner submits answers.
- If learner has not submitted answers yet: return passage/questions only, set metadata.awaitingLearnerAnswers=true, and store the key in metadata.hiddenAnswerKey.
- If learner submits answers: give concise feedback first, then provide the official answer key.
- Keep the conversation sweet, friendly, and cute while still professional.
- Use 1-2 warm emoji maximum when appropriate.
- For listening tasks, provide TTS-friendly transcript and optional YouTube references.
- Keep feedback specific, practical, and IELTS-oriented.
- Return strictly valid JSON following the expected schema.`,
            },
            ...contextualMessages,
            {
              role: 'user',
              content: payload.content,
            },
          ],
        }),
      });

      const rawPayload = (await aiResponse.json().catch(() => null)) as MistralResponse | null;

      if (!aiResponse.ok || !rawPayload) {
        console.error('Mistral AI chat error:', rawPayload);
        return NextResponse.json({ error: 'AI hiện đang bận. Vui lòng thử lại sau.' }, { status: 502 });
      }

      rawContent = extractMessageContent(rawPayload);
      const jsonText = extractJsonText(rawContent);

      if (jsonText) {
        try {
          parsedJson = JSON.parse(jsonText);
        } catch {
          parsedJson = {
            response: rawContent,
            contentType: tutor.defaultContentType,
            metadata: {},
            youtubeLinks: [],
          };
        }
      } else {
        parsedJson = {
          response: rawContent,
          contentType: tutor.defaultContentType,
          metadata: {},
          youtubeLinks: [],
        };
      }
    }

    const assistantPayload = normalizeAssistantPayload(
      parsedJson,
      normalizeFallbackContentType(tutor.defaultContentType),
      rawContent || payload.content
    );

    let finalAssistantResponse = assistantPayload.response;
    const finalAssistantMetadata: Record<string, unknown> = { ...(assistantPayload.metadata || {}) };

    if (isReadingMode && assistantPayload.contentType === 'READING_PASSAGE') {
      const stripped = stripReadingAnswerSection(finalAssistantResponse);
      const metadataAnswerKey = normalizeAnswerKey(finalAssistantMetadata.hiddenAnswerKey || finalAssistantMetadata.answerKey);
      const generatedAnswerKey = stripped.extractedAnswerKey || metadataAnswerKey;
      const effectiveAnswerKeyForReveal = generatedAnswerKey || readingWorkflowState.hiddenAnswerKey;

      if (holdBackReadingAnswers) {
        if (stripped.removed) {
          finalAssistantResponse = `${stripped.contentWithoutAnswers}\n\n---\n### Submit Your Answers\nPlease send your answers first (example: 1.D 2.A 3.E 4. April 28th). I will review them first, then reveal the official answer key.`;
        } else if (!/submit your answers|gửi đáp án|nộp đáp án/i.test(finalAssistantResponse)) {
          finalAssistantResponse = `${finalAssistantResponse.trim()}\n\n---\n### Submit Your Answers\nPlease send your answers first (example: 1.D 2.A 3.E 4. April 28th). I will review them first, then reveal the official answer key.`;
        }

        finalAssistantMetadata.awaitingLearnerAnswers = true;
        if (generatedAnswerKey) {
          finalAssistantMetadata.hiddenAnswerKey = generatedAnswerKey;
        }
        delete finalAssistantMetadata.answerKey;
      } else if (learnerSubmittedReadingAnswers) {
        finalAssistantMetadata.awaitingLearnerAnswers = false;
        if (effectiveAnswerKeyForReveal) {
          finalAssistantMetadata.hiddenAnswerKey = effectiveAnswerKeyForReveal;
        }

        const hasAnswerSection = /(?:^|\n)\s*(?:#{1,6}\s*)?(?:answers?|answer\s*key|đáp\s*án)\b/i.test(
          finalAssistantResponse
        );

        if (!hasAnswerSection && effectiveAnswerKeyForReveal) {
          finalAssistantResponse = `${finalAssistantResponse.trim()}\n\n### Official Answer Key\n${effectiveAnswerKeyForReveal}`;
        }
      }
    }

    const mergedMetadata = {
      ...finalAssistantMetadata,
      tutor: tutor.type,
      tutorName: tutor.name,
      youtubeLinks: assistantPayload.youtubeLinks,
      provider,
      modelUsed,
    };

    const createdAssistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'ASSISTANT',
        content: finalAssistantResponse,
        contentType: assistantPayload.contentType,
        metadata: asJsonValue(mergedMetadata),
      },
    });

    if (!chatSession.title || chatSession.title.startsWith('New chat with')) {
      await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: {
          title: buildSessionTitleFromMessage(payload.content),
        },
      });
    } else {
      await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: {
          updatedAt: new Date(),
        },
      });
    }

    return buildStreamingResponse(finalAssistantResponse, {
      id: createdAssistantMessage.id,
      role: createdAssistantMessage.role,
      content: createdAssistantMessage.content,
      contentType: createdAssistantMessage.contentType,
      metadata: createdAssistantMessage.metadata,
      createdAt: createdAssistantMessage.createdAt,
      sourceMessageId: createdUserMessage.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Dữ liệu gửi lên không hợp lệ.' },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json({ error: 'Không thể xử lý tin nhắn AI.' }, { status: 500 });
  }
}
