'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  lang?: string;
  voiceName?: string;
};

export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      setVoices(all);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const selectedDefaultVoice = useMemo(() => {
    return voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) || voices[0] || null;
  }, [voices]);

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!isSupported) {
        setError('Trình duyệt không hỗ trợ Text-to-Speech.');
        return;
      }

      const cleaned = text.trim();
      if (!cleaned) {
        return;
      }

      stop();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = options?.rate || 1;
      utterance.pitch = options?.pitch || 1;
      utterance.lang = options?.lang || 'en-US';

      const preferredVoice = options?.voiceName
        ? voices.find((voice) => voice.name === options.voiceName)
        : selectedDefaultVoice;

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setError(null);
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setError('Không thể phát giọng đọc lúc này.');
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, selectedDefaultVoice, stop, voices]
  );

  return {
    isSupported,
    isSpeaking,
    voices,
    error,
    speak,
    stop,
  };
}
