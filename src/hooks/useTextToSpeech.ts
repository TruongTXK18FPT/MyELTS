'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  lang?: string;
  voiceName?: string;
  voiceHints?: string[];
  chunkBySentence?: boolean;
  pauseMs?: number;
};

function splitIntoSpeechChunks(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [];
  }

  const sentenceChunks = normalized
    .split(/(?<=[.!?;:])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (sentenceChunks.length === 0) {
    return [normalized];
  }

  const output: string[] = [];
  let buffer = '';

  for (const sentence of sentenceChunks) {
    const next = buffer ? `${buffer} ${sentence}` : sentence;

    if (next.length > 220 && buffer) {
      output.push(buffer);
      buffer = sentence;
    } else {
      buffer = next;
    }
  }

  if (buffer) {
    output.push(buffer);
  }

  return output;
}

function selectPreferredVoice(
  voices: SpeechSynthesisVoice[],
  selectedDefaultVoice: SpeechSynthesisVoice | null,
  options?: SpeakOptions
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null;
  }

  if (options?.voiceName) {
    const byName = voices.find((voice) => voice.name === options.voiceName);
    if (byName) {
      return byName;
    }
  }

  const normalizedHints = (options?.voiceHints || [])
    .map((hint) => hint.toLowerCase().trim())
    .filter(Boolean);

  if (normalizedHints.length > 0) {
    const hintedVoices = voices.filter((voice) => {
      const token = `${voice.name} ${voice.lang}`.toLowerCase();
      return normalizedHints.some((hint) => token.includes(hint));
    });

    if (hintedVoices.length > 0) {
      return hintedVoices.find((voice) => voice.default) || hintedVoices[0];
    }
  }

  if (options?.lang) {
    const normalizedLang = options.lang.toLowerCase();
    const byLang = voices.filter((voice) => voice.lang.toLowerCase().startsWith(normalizedLang.slice(0, 2)));
    if (byLang.length > 0) {
      return byLang.find((voice) => voice.default) || byLang[0];
    }
  }

  return selectedDefaultVoice || voices[0] || null;
}

export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sequenceRef = useRef(0);

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

    sequenceRef.current += 1;
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

      const nextSequence = sequenceRef.current + 1;
      sequenceRef.current = nextSequence;

      const chunks = options?.chunkBySentence ? splitIntoSpeechChunks(cleaned) : [cleaned];
      const preferredVoice = selectPreferredVoice(voices, selectedDefaultVoice, options);
      const pauseMs = Math.max(0, options?.pauseMs ?? 120);

      if (chunks.length === 0) {
        return;
      }

      let index = 0;

      const speakNextChunk = () => {
        if (sequenceRef.current !== nextSequence || index >= chunks.length) {
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.rate = options?.rate || 1;
        utterance.pitch = options?.pitch || 1;
        utterance.lang = options?.lang || preferredVoice?.lang || 'en-US';

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          if (sequenceRef.current !== nextSequence) {
            return;
          }
          setError(null);
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          if (sequenceRef.current !== nextSequence) {
            return;
          }

          index += 1;

          if (index >= chunks.length) {
            setIsSpeaking(false);
            return;
          }

          window.setTimeout(() => {
            if (sequenceRef.current === nextSequence) {
              speakNextChunk();
            }
          }, pauseMs);
        };

        utterance.onerror = () => {
          if (sequenceRef.current !== nextSequence) {
            return;
          }
          setIsSpeaking(false);
          setError('Không thể phát giọng đọc lúc này.');
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNextChunk();
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
