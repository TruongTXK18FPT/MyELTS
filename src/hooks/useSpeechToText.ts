'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

type STTState = {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  error: string | null;
};

type UseSpeechToTextOptions = {
  lang?: string;
  continuous?: boolean;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>;
  }) => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionConstructor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const maybe = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };

  return maybe.SpeechRecognition || maybe.webkitSpeechRecognition || null;
}

export function useSpeechToText(options?: UseSpeechToTextOptions) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [state, setState] = useState<STTState>({
    transcript: '',
    interimTranscript: '',
    isListening: false,
    error: null,
  });

  const isSupported = useMemo(() => !!getRecognitionConstructor(), []);

  const reset = useCallback(() => {
    setState({ transcript: '', interimTranscript: '', isListening: false, error: null });
  }, []);

  const startListening = useCallback(() => {
    const Recognition = getRecognitionConstructor();

    if (!Recognition) {
      setState((prev) => ({ ...prev, error: 'Trình duyệt không hỗ trợ Speech-to-Text.' }));
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;

    recognition.lang = options?.lang || 'en-US';
    recognition.continuous = options?.continuous ?? true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false, interimTranscript: '' }));
    };

    recognition.onerror = (event) => {
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: event.error || 'Không thể nhận diện giọng nói.',
      }));
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          finalText += `${transcript} `;
        } else {
          interimText += transcript;
        }
      }

      setState((prev) => ({
        ...prev,
        transcript: `${prev.transcript}${finalText}`.trim(),
        interimTranscript: interimText,
      }));
    };

    recognition.start();
  }, [options?.continuous, options?.lang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const transcribeWithServer = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.set('audio', audioBlob, 'speaking-practice.webm');

    const response = await fetch('/api/ai-chat/audio', {
      method: 'POST',
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as { transcript?: string; error?: string } | null;

    if (!response.ok || !payload?.transcript) {
      throw new Error(payload?.error || 'Không thể chuyển đổi audio sang text.');
    }

    return payload.transcript;
  }, []);

  return {
    ...state,
    isSupported,
    startListening,
    stopListening,
    reset,
    transcribeWithServer,
  };
}
