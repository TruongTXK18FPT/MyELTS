'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechToText } from '@/hooks/useSpeechToText';

type SpeakingRecorderProps = {
  disabled?: boolean;
  onTranscriptReady: (transcript: string, audioBlob?: Blob | null) => void;
};

export function SpeakingRecorder({ disabled, onTranscriptReady }: SpeakingRecorderProps) {
  const { isRecording, startRecording, stopRecording, audioBlob, error: recorderError } = useAudioRecorder();
  const {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    transcribeWithServer,
    error: sttError,
    reset,
    isSupported,
  } = useSpeechToText({
    lang: 'en-US',
    continuous: true,
  });

  const [isTranscribing, setIsTranscribing] = useState(false);

  const toggleRecording = async () => {
    if (disabled) {
      return;
    }

    if (isRecording) {
      await stopRecording();
      stopListening();
      return;
    }

    reset();
    await startRecording();

    if (isSupported) {
      startListening();
    }
  };

  const sendTranscript = async () => {
    if (disabled) {
      return;
    }

    const combined = `${transcript} ${interimTranscript}`.trim();
    if (combined) {
      onTranscriptReady(combined, audioBlob);
      reset();
      return;
    }

    if (!audioBlob) {
      return;
    }

    try {
      setIsTranscribing(true);
      const serverTranscript = await transcribeWithServer(audioBlob);
      onTranscriptReady(serverTranscript, audioBlob);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge className="bg-emerald-600 text-white">Speaking Recorder</Badge>
        <Button
          type="button"
          size="sm"
          variant={isRecording ? 'destructive' : 'outline'}
          className="rounded-full"
          onClick={toggleRecording}
          disabled={disabled || isTranscribing}
        >
          {isRecording ? <MicOff className="mr-1 h-4 w-4" /> : <Mic className="mr-1 h-4 w-4" />}
          {isRecording ? 'Stop' : 'Record'}
        </Button>
      </div>

      <div className="flex min-h-14 items-center rounded-xl bg-white/70 px-3 text-sm text-emerald-900">
        {isRecording ? (
          <div className="flex w-full items-center gap-1.5">
            {Array.from({ length: 20 }).map((_, index) => (
              <span
                key={index}
                className="h-2 w-1 rounded-full bg-emerald-500 animate-ai-wave"
                style={{ animationDelay: `${index * 0.05}s` }}
              />
            ))}
          </div>
        ) : (
          <p className="line-clamp-3 whitespace-pre-wrap">{`${transcript} ${interimTranscript}`.trim() || 'Nhấn Record để bắt đầu nói.'}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-emerald-700">{recorderError || sttError || (isListening ? 'Đang nghe giọng nói...' : 'Sẵn sàng.')}</p>
        <Button
          type="button"
          size="sm"
          className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={sendTranscript}
          disabled={disabled || isRecording || isTranscribing || (!transcript.trim() && !audioBlob)}
        >
          <Send className="mr-1 h-4 w-4" />
          {isTranscribing ? 'Transcribing...' : 'Use Transcript'}
        </Button>
      </div>
    </div>
  );
}
