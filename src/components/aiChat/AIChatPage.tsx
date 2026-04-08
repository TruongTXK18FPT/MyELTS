'use client';

import { useMemo, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatLayout } from './ChatLayout';
import { getTutorCard, TUTOR_QUICK_ACTIONS } from '@/lib/tutor-client';
import type { MessageContentType } from '@/lib/chat-utils';
import { TutorSelector } from './TutorSelector';
import { TutorAvatar } from './TutorAvatar';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

type SendPayload = {
  content: string;
  contentType?: MessageContentType;
  metadata?: Record<string, unknown>;
  imageFile?: File | null;
  audioBlob?: Blob | null;
};

async function uploadAsset(file: File, folder: string): Promise<string | null> {
  const formData = new FormData();
  formData.set('file', file);
  formData.set('folder', folder);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

  if (!response.ok || !payload?.url) {
    console.error('Upload failed:', payload?.error || 'Unknown upload error');
    return null;
  }

  return payload.url;
}

export function AIChatPage() {
  const [hasEnteredChat, setHasEnteredChat] = useState(false);
  const [isPreparingMessage, setIsPreparingMessage] = useState(false);

  const {
    selectedTutor,
    setSelectedTutor,
    sessions,
    activeSessionId,
    messages,
    isLoadingSessions,
    isLoadingMessages,
    isSending,
    error,
    openSession,
    createSession,
    sendMessage,
    archiveSession,
    deleteSession,
  } = useChat({
    initialTutor: 'WRITING_TASK1',
  });

  const tutorCard = useMemo(() => getTutorCard(selectedTutor), [selectedTutor]);
  const quickActions = useMemo(() => TUTOR_QUICK_ACTIONS[selectedTutor] || [], [selectedTutor]);

  const canStartChat = !isLoadingSessions;

  const onSendMessage = async (payload: SendPayload) => {
    setIsPreparingMessage(true);

    let imageUrl: string | null = null;
    let audioUrl: string | null = null;

    try {
      if (payload.imageFile) {
        imageUrl = await uploadAsset(payload.imageFile, 'myelts/ai-chat/images');
      }

      if (payload.audioBlob) {
        const audioFile = new File([payload.audioBlob], `speaking-${Date.now()}.webm`, {
          type: payload.audioBlob.type || 'audio/webm',
        });
        audioUrl = await uploadAsset(audioFile, 'myelts/ai-chat/audio');
      }

      await sendMessage({
        content: payload.content,
        contentType: payload.contentType,
        metadata: payload.metadata,
        imageUrl,
        audioUrl,
      });
    } finally {
      setIsPreparingMessage(false);
    }
  };

  if (!hasEnteredChat) {
    return (
      <section className="mx-auto w-full max-w-6xl rounded-[2rem] border border-rose-200/70 bg-white/75 p-4 shadow-2xl shadow-rose-200/40 backdrop-blur-xl md:p-6">
        <div className="rounded-3xl bg-gradient-to-br from-rose-100/75 via-pink-100/65 to-fuchsia-100/65 p-4 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1 rounded-full border border-rose-300/60 bg-white/70 px-3 py-1 text-xs font-semibold text-rose-600">
                <Sparkles className="h-3.5 w-3.5" />
                Premium AI Tutor Lobby
              </p>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-rose-900 md:text-3xl">Chọn giảng viên trước khi bắt đầu chat</h1>
              <p className="mt-2 text-sm text-rose-700 md:text-base">
                Giao diện tone hồng dễ thương đã sẵn sàng. Bạn chọn tutor, rồi bắt đầu phiên học IELTS cá nhân hóa.
              </p>
            </div>
            <TutorAvatar name={tutorCard.name} emoji={tutorCard.emoji} accent={tutorCard.accent} size="lg" />
          </div>

          <TutorSelector selectedTutor={selectedTutor} onSelectTutor={setSelectedTutor} />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/80 bg-white/65 p-3">
            <div>
              <p className="text-sm font-semibold text-rose-900">Tutor đã chọn: {tutorCard.name}</p>
              <p className="text-xs text-rose-700">{tutorCard.subtitle} - {tutorCard.description}</p>
            </div>
            <Button
              type="button"
              disabled={!canStartChat}
              className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 text-white hover:from-rose-600 hover:to-pink-600"
              onClick={async () => {
                if (!activeSessionId && sessions.length === 0) {
                  await createSession(selectedTutor);
                }
                setHasEnteredChat(true);
              }}
            >
              {isLoadingSessions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Bắt đầu chat ngay
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <ChatLayout
      selectedTutor={selectedTutor}
      tutorCard={tutorCard}
      quickActions={quickActions}
      sessions={sessions}
      activeSessionId={activeSessionId}
      messages={messages}
      isLoadingSessions={isLoadingSessions}
      isLoadingMessages={isLoadingMessages}
      isSending={isSending || isPreparingMessage}
      error={error}
      onSelectTutor={setSelectedTutor}
      onCreateSession={() => {
        void createSession(selectedTutor);
      }}
      onOpenSession={(sessionId) => {
        void openSession(sessionId);
      }}
      onArchiveSession={(sessionId) => {
        void archiveSession(sessionId);
      }}
      onDeleteSession={(sessionId) => {
        void deleteSession(sessionId);
      }}
      onSendMessage={onSendMessage}
    />
  );
}
