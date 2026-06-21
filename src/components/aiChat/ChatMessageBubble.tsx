"use client";

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatChatTime, type ChatMessageItem } from '@/lib/chat-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all font-mono"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400 animate-in fade-in zoom-in duration-150" />
          <span className="text-emerald-400 font-semibold text-[10px]">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 text-slate-400" />
          <span className="text-[10px]">Copy</span>
        </>
      )}
    </button>
  );
}
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
                      'font-semibold underline decoration-1 underline-offset-2 transition-colors',
                      isFromUser 
                        ? 'text-rose-100 hover:text-white' 
                        : 'text-rose-600 hover:text-rose-700'
                    )}
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className={cn(
                    'border-l-4 pl-3 py-1 my-2 rounded-r-lg italic font-sans',
                    isFromUser 
                      ? 'border-white bg-white/10 text-rose-50' 
                      : 'border-rose-400 bg-rose-50/50 text-rose-800'
                  )}>
                    {children}
                  </blockquote>
                ),
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5 font-sans">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5 font-sans">{children}</ol>,
                table: ({ children }) => (
                  <div className={cn(
                    'chat-markdown-table border my-2 overflow-x-auto rounded-xl max-w-full',
                    isFromUser 
                      ? 'border-rose-400 bg-rose-600/20' 
                      : 'border-rose-100 bg-white/90'
                  )}>
                    <table className={cn(
                      'min-w-full divide-y',
                      isFromUser ? 'divide-rose-400' : 'divide-rose-100'
                    )}>{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className={cn(
                    'px-3 py-1.5 text-left text-xs font-bold font-mono',
                    isFromUser 
                      ? 'bg-rose-600/40 text-white border-b border-rose-450' 
                      : 'bg-rose-50 text-rose-900 border-b border-rose-100'
                  )}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className={cn(
                    'px-3 py-1.5 text-xs border-b',
                    isFromUser 
                      ? 'text-rose-100 border-rose-500/20' 
                      : 'text-rose-800 border-rose-50/50'
                  )}>
                    {children}
                  </td>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');
                  
                  if (isInline) {
                    return (
                      <code
                        className={cn(
                          'rounded px-1.5 py-0.5 font-mono text-[11px]',
                          isFromUser 
                            ? 'bg-white/20 text-white' 
                            : 'bg-rose-100/80 text-rose-800'
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  
                  return (
                    <div className="my-2.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-md font-sans w-full">
                      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 font-mono text-[9px] text-slate-400">
                        <span className="font-semibold uppercase tracking-wider text-rose-400">
                          {match ? match[1] : 'code'}
                        </span>
                        <CopyButton text={String(children).replace(/\n$/, '')} />
                      </div>
                      <pre className="overflow-x-auto p-3.5 font-mono text-[11px] leading-relaxed text-slate-300">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                }
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
