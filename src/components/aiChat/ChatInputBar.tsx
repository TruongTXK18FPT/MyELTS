"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Paperclip, SendHorizonal, X } from 'lucide-react';
import { QuickActions } from './QuickActions';
import { SpeakingRecorder } from './SpeakingRecorder';
import type { TutorQuickAction } from '@/lib/tutor-client';
import type { MessageContentType, TutorType } from '@/lib/chat-utils';

type SendPayload = {
  content: string;
  contentType?: MessageContentType;
  metadata?: Record<string, unknown>;
  imageFile?: File | null;
  audioBlob?: Blob | null;
};

type ChatInputBarProps = {
  tutorType: TutorType;
  isSending?: boolean;
  quickActions: TutorQuickAction[];
  onSendMessage: (payload: SendPayload) => Promise<void>;
};

export function ChatInputBar({ tutorType, isSending, quickActions, onSendMessage }: ChatInputBarProps) {
  const [value, setValue] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [languagePreference, setLanguagePreference] = useState<'auto' | 'vi' | 'en'>('auto');
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const nextPreview = URL.createObjectURL(imageFile);
    setImagePreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [imageFile]);

  const resetComposer = () => {
    setValue('');
    setImageFile(null);

    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
    }
  };

  const autosize = () => {
    if (!textAreaRef.current) {
      return;
    }

    textAreaRef.current.style.height = 'auto';
    textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 180)}px`;
  };

  const send = async (content: string, options?: { image?: File | null; audioBlob?: Blob | null }) => {
    const trimmed = content.trim();
    if (!trimmed || isSending) {
      return;
    }

    const payload: SendPayload = {
      content: trimmed,
      contentType: tutorType === 'SPEAKING' ? 'SPEAKING_FEEDBACK' : imageFile ? 'IMAGE' : 'TEXT',
      metadata: {
        languagePreference,
        cuteTone: true,
      },
      imageFile: options?.image ?? imageFile,
      audioBlob: options?.audioBlob || null,
    };

    await onSendMessage(payload);
    resetComposer();
  };

  const onPaste: React.ClipboardEventHandler<HTMLTextAreaElement> = (event) => {
    const file = event.clipboardData.files?.[0];
    if (file && file.type.startsWith('image/')) {
      event.preventDefault();
      setImageFile(file);
    }
  };

  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const onSubmit = async () => {
    await send(value);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await onSubmit();
    }
  };

  return (
    <div className="space-y-3 rounded-3xl border border-rose-200/70 bg-white/75 p-3 shadow-xl shadow-rose-200/40 backdrop-blur-md">
      <QuickActions
        actions={quickActions}
        disabled={isSending}
        onSelect={async (action) => {
          await send(action.prompt);
        }}
      />

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-rose-700">Language:</span>
        {[
          { key: 'auto', label: 'Auto' },
          { key: 'vi', label: 'VI' },
          { key: 'en', label: 'EN' },
        ].map((option) => (
          <Button
            key={option.key}
            type="button"
            size="sm"
            variant="outline"
            disabled={isSending}
            className={`h-7 rounded-full px-3 text-xs ${
              languagePreference === option.key
                ? 'border-rose-400 bg-rose-100 text-rose-700'
                : 'border-rose-200 bg-white/80 text-rose-500'
            }`}
            onClick={() => setLanguagePreference(option.key as 'auto' | 'vi' | 'en')}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {imagePreview && (
        <div className="relative w-fit rounded-2xl border border-rose-200/80 bg-white p-2">
          <img src={imagePreview} alt="Preview" className="max-h-28 rounded-xl object-contain" />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
            onClick={() => setImageFile(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="relative">
        <Textarea
          ref={textAreaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            autosize();
          }}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Type your IELTS request..."
          className="min-h-[52px] resize-none rounded-2xl border-rose-200/70 bg-white py-3 pl-4 pr-28"
          disabled={isSending}
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileSelected}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-rose-500 hover:bg-rose-100 hover:text-rose-700"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Paperclip className="h-4.5 w-4.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg hover:from-rose-600 hover:to-pink-600"
            onClick={onSubmit}
            disabled={isSending || (!value.trim() && !imageFile)}
          >
            {isSending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <SendHorizonal className="h-4.5 w-4.5" />}
          </Button>
        </div>
      </div>

      {tutorType === 'SPEAKING' && (
        <SpeakingRecorder
          disabled={isSending}
          onTranscriptReady={async (transcript, audioBlob) => {
            await send(transcript, { audioBlob });
          }}
        />
      )}
    </div>
  );
}
