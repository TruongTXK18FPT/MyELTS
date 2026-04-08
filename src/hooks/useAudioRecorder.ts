'use client';

import { useCallback, useRef, useState } from 'react';

type RecorderState = {
  isRecording: boolean;
  isSupported: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
};

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    isSupported: typeof window !== 'undefined' && 'MediaRecorder' in window,
    audioBlob: null,
    audioUrl: null,
    error: null,
  });

  const clear = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    setState((prev) => ({
      ...prev,
      audioBlob: null,
      audioUrl: null,
      error: null,
    }));
  }, [state.audioUrl]);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof window === 'undefined' || !('MediaRecorder' in window)) {
      setState((prev) => ({ ...prev, isSupported: false, error: 'Trình duyệt không hỗ trợ ghi âm.' }));
      return;
    }

    try {
      clear();
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setState((prev) => ({ ...prev, error: 'Không thể ghi âm. Vui lòng thử lại.' }));
      };

      recorder.onstart = () => {
        setState((prev) => ({ ...prev, isRecording: true, error: null }));
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);

        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob: blob,
          audioUrl: url,
        }));

        stopTracks();
      };

      recorder.start();
    } catch (error) {
      console.error(error);
      stopTracks();
      setState((prev) => ({ ...prev, error: 'Không thể truy cập microphone.' }));
    }
  }, [clear, stopTracks]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === 'inactive') {
      return state.audioBlob;
    }

    return new Promise((resolve) => {
      const originalOnStop = recorder.onstop;

      recorder.onstop = (event: Event) => {
        originalOnStop?.call(recorder, event);
        resolve(new Blob(chunksRef.current, { type: 'audio/webm' }));
      };

      recorder.stop();
    });
  }, [state.audioBlob]);

  return {
    ...state,
    startRecording,
    stopRecording,
    clear,
  };
}
