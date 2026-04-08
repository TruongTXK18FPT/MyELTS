"use client";

import { useEffect, useRef } from 'react';
import { AlertCircle, Loader2, MessageSquareText, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInputBar } from './ChatInputBar';
import { SessionSidebar } from './SessionSidebar';
import { TutorSelector } from './TutorSelector';
import { TutorAvatar } from './TutorAvatar';
import type { TutorCard, TutorQuickAction } from '@/lib/tutor-client';
import type { ChatMessageItem, ChatSessionItem, TutorType } from '@/lib/chat-utils';

type ChatLayoutProps = {
  selectedTutor: TutorType;
  tutorCard: TutorCard;
  quickActions: TutorQuickAction[];
  sessions: ChatSessionItem[];
  activeSessionId: string | null;
  messages: ChatMessageItem[];
  isLoadingSessions?: boolean;
  isLoadingMessages?: boolean;
  isSending?: boolean;
  error?: string | null;
  onSelectTutor: (tutor: TutorType) => void;
  onCreateSession: () => void;
  onOpenSession: (sessionId: string) => void;
  onArchiveSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onSendMessage: (payload: {
    content: string;
    contentType?: ChatMessageItem['contentType'];
    metadata?: Record<string, unknown>;
    imageFile?: File | null;
    audioBlob?: Blob | null;
  }) => Promise<void>;
};

export function ChatLayout({
  selectedTutor,
  tutorCard,
  quickActions,
  sessions,
  activeSessionId,
  messages,
  isLoadingSessions,
  isLoadingMessages,
  isSending,
  error,
  onSelectTutor,
  onCreateSession,
  onOpenSession,
  onArchiveSession,
  onDeleteSession,
  onSendMessage,
}: ChatLayoutProps) {
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="grid min-h-[calc(100vh-2rem)] gap-3 lg:h-[calc(100dvh-9.5rem)] lg:min-h-[36rem] lg:grid-cols-[300px_minmax(0,1fr)_320px]">
      <div className="hidden min-h-0 lg:block">
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoading={isLoadingSessions}
          onCreateSession={onCreateSession}
          onOpenSession={onOpenSession}
          onArchiveSession={onArchiveSession}
          onDeleteSession={onDeleteSession}
        />
      </div>

      <section className="flex min-h-0 flex-col rounded-3xl border border-rose-200/60 bg-white/65 p-3 shadow-xl shadow-rose-200/40 backdrop-blur-md lg:h-full">
        <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-rose-200/60 bg-gradient-to-r from-rose-50/90 to-pink-50/90 px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <TutorAvatar name={tutorCard.name} emoji={tutorCard.emoji} accent={tutorCard.accent} size="sm" isTyping={isSending} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-rose-900">{tutorCard.name}</p>
              <p className="truncate text-xs text-rose-700">{tutorCard.subtitle}</p>
            </div>
          </div>

          {isSending ? (
            <div className="hidden items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[11px] font-medium text-rose-700 md:inline-flex">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang trả lời...
            </div>
          ) : null}

          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="rounded-full border-rose-200 bg-white/80 text-rose-700">
                  <MessageSquareText className="mr-1 h-4 w-4" />
                  Sessions
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="h-full w-[90vw] max-w-sm bg-rose-50/95 p-2">
                <SheetTitle className="sr-only">Chat Sessions</SheetTitle>
                <SessionSidebar
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  isLoading={isLoadingSessions}
                  onCreateSession={onCreateSession}
                  onOpenSession={onOpenSession}
                  onArchiveSession={onArchiveSession}
                  onDeleteSession={onDeleteSession}
                />
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="rounded-full border-rose-200 bg-white/80 text-rose-700">
                  <Users className="mr-1 h-4 w-4" />
                  Tutors
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[92vw] max-w-lg overflow-y-auto bg-rose-50/95 p-4">
                <SheetTitle className="sr-only">Tutor Selector</SheetTitle>
                <TutorSelector selectedTutor={selectedTutor} onSelectTutor={onSelectTutor} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1 rounded-2xl border border-rose-200/60 bg-gradient-to-b from-rose-50/55 to-pink-50/35 p-3">
          <div className="space-y-4 pb-3">
            {messages.length === 0 && !isLoadingMessages && (
              <div className="rounded-2xl border border-dashed border-rose-200/70 bg-white/65 p-6 text-center">
                <p className="text-sm font-semibold text-rose-800">Bắt đầu phiên IELTS Premium</p>
                <p className="mt-1 text-xs text-rose-600">Chọn quick action bên dưới hoặc gửi câu hỏi đầu tiên.</p>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                tutorName={tutorCard.name}
                tutorEmoji={tutorCard.emoji}
                tutorAccent={tutorCard.accent}
                isTyping={isSending}
              />
            ))}

            {isLoadingMessages && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-rose-100/60" />
                ))}
              </div>
            )}

            <div ref={scrollAnchorRef} />
          </div>
        </ScrollArea>

        <div className="mt-3">
          <ChatInputBar
            tutorType={selectedTutor}
            quickActions={quickActions}
            isSending={isSending}
            onSendMessage={onSendMessage}
          />
        </div>
      </section>

      <aside className="hidden min-h-0 lg:block">
        <div className="flex h-full flex-col gap-3 rounded-3xl border border-rose-200/60 bg-white/65 p-3 shadow-xl shadow-rose-200/40 backdrop-blur-md">
          <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/95 to-pink-50/95 p-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-rose-600 text-white">Active Tutor</Badge>
              <span className="text-xs font-medium text-rose-700">Emoji Avatar</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <TutorAvatar name={tutorCard.name} emoji={tutorCard.emoji} accent={tutorCard.accent} size="md" isTyping={isSending} />
              <div>
                <p className="text-sm font-semibold text-rose-900">{tutorCard.name}</p>
                <p className="text-xs text-rose-700">{tutorCard.subtitle}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-rose-700">{tutorCard.description}</p>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <TutorSelector selectedTutor={selectedTutor} onSelectTutor={onSelectTutor} compact />
          </ScrollArea>
        </div>
      </aside>
    </div>
  );
}
