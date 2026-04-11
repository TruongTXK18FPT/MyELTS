"use client";

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatChatTime, type ChatMessageItem } from '@/lib/chat-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TutorAvatar } from './TutorAvatar';
import { EssayEvaluationCard } from './EssayEvaluationCard';
import { AudioPlayer } from './AudioPlayer';
import { ReadingPassageCard } from './ReadingPassageCard';

type ChatMessageBubbleProps = {
  message: ChatMessageItem;
  tutorName: string;
  tutorEmoji: string;
  tutorAccent: string;
  isTyping?: boolean;
};

function SpeakingFeedbackCard({ metadata }: { metadata: Record<string, unknown> | null }) {
  const fluency = Number(metadata?.fluency || 0);
  const pronunciation = Number(metadata?.pronunciation || 0);
  const vocabulary = Number(metadata?.vocabulary || 0);
  const grammar = Number(metadata?.grammar || 0);

  const rows = [
    { label: 'Fluency', value: fluency },
    { label: 'Pronunciation', value: pronunciation },
    { label: 'Vocabulary', value: vocabulary },
    { label: 'Grammar', value: grammar },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
      <div className="flex items-center justify-between">
        <Badge className="bg-emerald-600 text-white">Speaking Feedback</Badge>
        <span className="text-xs font-medium text-emerald-700">Estimated band</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-emerald-100 bg-white/75 px-3 py-2">
            <p className="text-xs text-muted-foreground">{row.label}</p>
            <p className="text-base font-semibold text-emerald-700">{Number.isFinite(row.value) ? row.value.toFixed(1) : '-'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatMessageBubble({ message, tutorName, tutorEmoji, tutorAccent, isTyping = false }: ChatMessageBubbleProps) {
  const isFromUser = message.role === 'USER';
  const isLoadingResponse = !isFromUser && isTyping && message.content.trim().toLowerCase().includes('tôi đang thực hiện yêu cầu của bạn');
  const shouldRenderInlineMarkdown = !(message.contentType === 'READING_PASSAGE' && !isFromUser);

  const youtubeLinks = Array.isArray(message.metadata?.youtubeLinks)
    ? (message.metadata.youtubeLinks as unknown[]).filter((item): item is string => typeof item === 'string')
    : [];

  return (
    <div className={cn('flex items-end gap-2.5', isFromUser && 'justify-end')}>
      {!isFromUser && (
        <TutorAvatar
          name={tutorName}
          emoji={tutorEmoji}
          accent={tutorAccent}
          size="sm"
          isTyping={isTyping && !message.content.trim()}
        />
      )}

      <div
        className={cn(
          'max-w-[86%] space-y-2 rounded-2xl p-3 text-sm break-words md:max-w-[76%]',
          isFromUser
            ? 'rounded-br-md bg-gradient-to-r from-rose-500 to-pink-500 text-white'
            : 'rounded-bl-md border border-rose-200/60 bg-white/80 text-rose-900 shadow-lg shadow-rose-200/30 backdrop-blur'
        )}
      >
        {message.contentType === 'ESSAY_EVALUATION' && !isFromUser && <EssayEvaluationCard metadata={message.metadata} />}

        {message.contentType === 'LISTENING_EXERCISE' && !isFromUser && (
          <AudioPlayer audioUrl={message.audioUrl} transcript={message.content} youtubeLinks={youtubeLinks} metadata={message.metadata} />
        )}

        {message.contentType === 'READING_PASSAGE' && !isFromUser && (
          <ReadingPassageCard content={message.content} metadata={message.metadata} />
        )}

        {message.contentType === 'SPEAKING_FEEDBACK' && !isFromUser && <SpeakingFeedbackCard metadata={message.metadata} />}

        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Uploaded"
            className="max-h-64 rounded-xl border border-white/50 object-contain"
          />
        )}

        {isLoadingResponse ? (
          <div className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {message.content}
          </div>
        ) : shouldRenderInlineMarkdown ? (
          <div className={cn('chat-markdown', isFromUser ? 'text-white' : 'text-rose-900')}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={cn(
                      'font-medium underline decoration-1 underline-offset-2',
                      isFromUser ? 'text-rose-50' : 'text-rose-700 hover:text-rose-800'
                    )}
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="chat-markdown-table">
                    <table>{children}</table>
                  </div>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : null}

        <p className={cn('text-[11px]', isFromUser ? 'text-rose-100' : 'text-rose-500')}>
          {formatChatTime(message.createdAt)}
        </p>
      </div>

      {isFromUser && (
        <Avatar className="h-9 w-9 border border-rose-200">
          <AvatarFallback className="bg-rose-100 text-rose-700">
            <User className="h-4.5 w-4.5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
