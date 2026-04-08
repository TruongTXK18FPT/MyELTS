'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ChatMessageItem,
  type ChatSessionItem,
  type MessageContentType,
  type TutorType,
  consumeEventStream,
  isMessageContentType,
} from '@/lib/chat-utils';

type SendMessageInput = {
  content: string;
  contentType?: MessageContentType;
  metadata?: Record<string, unknown>;
  audioUrl?: string | null;
  imageUrl?: string | null;
  contextLimit?: number;
};

type UseChatOptions = {
  initialTutor?: TutorType;
};

type SessionsResponse = {
  sessions: ChatSessionItem[];
};

type SessionDetailResponse = {
  session: ChatSessionItem;
  messages: ChatMessageItem[];
};

const DEFAULT_TUTOR: TutorType = 'WRITING_TASK1';
const ASSISTANT_LOADING_MESSAGE = 'Tôi đang thực hiện yêu cầu của bạn...';

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
  }

  return fallback;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function useChat(options?: UseChatOptions) {
  const [selectedTutor, setSelectedTutor] = useState<TutorType>(options?.initialTutor || DEFAULT_TUTOR);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [activeSessionId, sessions]
  );

  const loadSessions = useCallback(
    async (tutor: TutorType = selectedTutor): Promise<ChatSessionItem[]> => {
      setIsLoadingSessions(true);
      setError(null);

      try {
        const response = await fetch(`/api/ai-chat/sessions?tutorType=${tutor}&archived=false`, {
          method: 'GET',
          cache: 'no-store',
        });

        const payload = (await response.json().catch(() => null)) as SessionsResponse | { error?: string } | null;

        if (!response.ok || !payload || !('sessions' in payload)) {
          throw new Error(getErrorMessage(payload, 'Không thể tải phiên chat.'));
        }

        const loadedSessions = payload.sessions || [];
        setSessions(loadedSessions);
        return loadedSessions;
      } catch (loadError) {
        console.error(loadError);
        const nextError = loadError instanceof Error ? loadError.message : 'Không thể tải phiên chat.';
        setError(nextError);
        return [];
      } finally {
        setIsLoadingSessions(false);
      }
    },
    [selectedTutor]
  );

  const openSession = useCallback(async (sessionId: string) => {
    setIsLoadingMessages(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai-chat/sessions/${sessionId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => null)) as SessionDetailResponse | { error?: string } | null;

      if (!response.ok || !payload || !('messages' in payload)) {
        throw new Error(getErrorMessage(payload, 'Không thể tải tin nhắn của phiên chat.'));
      }

      setActiveSessionId(sessionId);
      setMessages(payload.messages || []);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải phiên chat.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const createSession = useCallback(
    async (tutor: TutorType = selectedTutor, title?: string): Promise<ChatSessionItem | null> => {
      setError(null);

      try {
        const response = await fetch('/api/ai-chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tutorType: tutor, title }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { session?: ChatSessionItem; error?: string }
          | null;

        if (!response.ok || !payload?.session) {
          throw new Error(getErrorMessage(payload, 'Không thể tạo phiên chat mới.'));
        }

        setSessions((prev) => [payload.session as ChatSessionItem, ...prev]);
        setActiveSessionId(payload.session.id);
        setMessages([]);

        return payload.session as ChatSessionItem;
      } catch (createError) {
        console.error(createError);
        setError(createError instanceof Error ? createError.message : 'Không thể tạo phiên chat.');
        return null;
      }
    },
    [selectedTutor]
  );

  const archiveSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai-chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isArchived: true }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(getErrorMessage(payload, 'Không thể lưu trữ phiên chat.'));
      }

      setSessions((prev) => prev.filter((item) => item.id !== sessionId));

      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (archiveError) {
      console.error(archiveError);
      setError(archiveError instanceof Error ? archiveError.message : 'Không thể lưu trữ phiên chat.');
    }
  }, [activeSessionId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai-chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(getErrorMessage(payload, 'Không thể xóa phiên chat.'));
      }

      setSessions((prev) => prev.filter((item) => item.id !== sessionId));

      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Không thể xóa phiên chat.');
    }
  }, [activeSessionId]);

  const sendMessage = useCallback(
    async (input: SendMessageInput): Promise<void> => {
      const text = input.content.trim();
      if (!text) {
        return;
      }

      setIsSending(true);
      setError(null);

      let targetSessionId = activeSessionId;
      if (!targetSessionId) {
        const newSession = await createSession(selectedTutor);
        if (!newSession) {
          setIsSending(false);
          return;
        }
        targetSessionId = newSession.id;
      }

      const now = nowIso();
      const tempUserId = `temp-user-${Date.now()}`;
      const tempAssistantId = `temp-assistant-${Date.now()}`;

      const optimisticUserMessage: ChatMessageItem = {
        id: tempUserId,
        sessionId: targetSessionId,
        role: 'USER',
        content: text,
        contentType: input.contentType || 'TEXT',
        metadata: input.metadata || null,
        audioUrl: input.audioUrl || null,
        imageUrl: input.imageUrl || null,
        createdAt: now,
      };

      const optimisticAssistantMessage: ChatMessageItem = {
        id: tempAssistantId,
        sessionId: targetSessionId,
        role: 'ASSISTANT',
        content: ASSISTANT_LOADING_MESSAGE,
        contentType: 'TEXT',
        metadata: null,
        audioUrl: null,
        imageUrl: null,
        createdAt: now,
      };

      setMessages((prev) => [...prev, optimisticUserMessage, optimisticAssistantMessage]);

      try {
        const response = await fetch('/api/ai-chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: targetSessionId,
            content: text,
            contentType: input.contentType || 'TEXT',
            metadata: input.metadata,
            audioUrl: input.audioUrl,
            imageUrl: input.imageUrl,
            contextLimit: input.contextLimit,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(getErrorMessage(payload, 'Không thể gửi tin nhắn đến AI.'));
        }

        if (!response.body) {
          throw new Error('Không nhận được stream phản hồi từ AI.');
        }

        let assistantText = '';
        let donePayload: Record<string, unknown> = {};

        await consumeEventStream(response.body, {
          onDelta: (delta) => {
            assistantText += delta;
            setMessages((prev) =>
              prev.map((message) =>
                message.id === tempAssistantId
                  ? {
                      ...message,
                      content: assistantText,
                    }
                  : message
              )
            );
          },
          onDone: (payload) => {
            donePayload = payload;
          },
        });

        const normalizedContentType = isMessageContentType(donePayload.contentType)
          ? donePayload.contentType
          : 'TEXT';

        const normalizedMetadata =
          donePayload.metadata && typeof donePayload.metadata === 'object'
            ? (donePayload.metadata as Record<string, unknown>)
            : null;

        const normalizedMessageId =
          typeof donePayload.id === 'string' && donePayload.id.trim() ? donePayload.id : tempAssistantId;

        const normalizedCreatedAt =
          typeof donePayload.createdAt === 'string' && donePayload.createdAt.trim()
            ? donePayload.createdAt
            : nowIso();

        const normalizedContent =
          typeof donePayload.content === 'string' && donePayload.content.trim()
            ? donePayload.content
            : assistantText.trim()
            ? assistantText
            : ASSISTANT_LOADING_MESSAGE;

        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== tempAssistantId) {
              return message;
            }

            return {
              ...message,
              id: normalizedMessageId,
              content: normalizedContent,
              contentType: normalizedContentType,
              metadata: normalizedMetadata,
              createdAt: normalizedCreatedAt,
            };
          })
        );

        void loadSessions(selectedTutor);
      } catch (sendError) {
        console.error(sendError);
        const nextError = sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.';
        setError(nextError);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempAssistantId
              ? {
                  ...message,
                  content: `Xin lỗi, đã có lỗi xảy ra: ${nextError}`,
                  contentType: 'TEXT',
                }
              : message
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [activeSessionId, createSession, loadSessions, selectedTutor]
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const loaded = await loadSessions(selectedTutor);

      if (cancelled) {
        return;
      }

      if (loaded.length > 0) {
        await openSession(loaded[0].id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadSessions, openSession, selectedTutor]);

  return {
    selectedTutor,
    setSelectedTutor,
    sessions,
    activeSession,
    activeSessionId,
    messages,
    isLoadingSessions,
    isLoadingMessages,
    isSending,
    error,
    loadSessions,
    openSession,
    createSession,
    sendMessage,
    archiveSession,
    deleteSession,
  };
}
