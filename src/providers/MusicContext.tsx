'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface MusicTrackData {
  id: string;
  title: string;
  url: string;
  platform: 'YOUTUBE' | 'SPOTIFY';
  platformId: string;
  thumbnail: string | null;
  artist: string | null;
  duration: string | null;
  addedBy?: {
    id: string;
    name: string | null;
    image: string | null;
    avatar?: string | null;
  };
}

export type RepeatMode = 'off' | 'all' | 'one';

interface MusicContextType {
  currentTrack: MusicTrackData | null;
  queue: MusicTrackData[];
  isPlaying: boolean;
  isRobotOpen: boolean;
  isRobotMinimized: boolean;
  autoplay: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  play: (track: MusicTrackData) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  setQueue: (tracks: MusicTrackData[]) => void;
  playPlaylist: (tracks: MusicTrackData[], startIndex?: number) => void;
  toggleRobot: () => void;
  minimizeRobot: () => void;
  expandRobot: () => void;
  toggleAutoplay: () => void;
  toggleRepeatMode: () => void;
  toggleShuffle: () => void;
  handleTrackEnded: () => void;
  currentIndex: number;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrackData | null>(null);
  const [queue, setQueueState] = useState<MusicTrackData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRobotOpen, setIsRobotOpen] = useState(false);
  const [isRobotMinimized, setIsRobotMinimized] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const queueRef = useRef<MusicTrackData[]>([]);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const play = useCallback((track: MusicTrackData) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setIsRobotOpen(true);
    setIsRobotMinimized(false);

    // Find index in queue
    const idx = queueRef.current.findIndex((t) => t.id === track.id);
    if (idx >= 0) {
      setCurrentIndex(idx);
    }
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const getNextIndex = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return -1;

    if (shuffle) {
      // Pick a random index that's different from current
      if (q.length === 1) return 0;
      let nextIdx;
      do {
        nextIdx = Math.floor(Math.random() * q.length);
      } while (nextIdx === currentIndexRef.current && q.length > 1);
      return nextIdx;
    }

    return (currentIndexRef.current + 1) % q.length;
  }, [shuffle]);

  const next = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const nextIndex = getNextIndex();
    if (nextIndex < 0) return;
    setCurrentIndex(nextIndex);
    setCurrentTrack(queueRef.current[nextIndex]);
    setIsPlaying(true);
  }, [getNextIndex]);

  const previous = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const ci = currentIndexRef.current;
    const prevIndex = ci <= 0 ? queueRef.current.length - 1 : ci - 1;
    setCurrentIndex(prevIndex);
    setCurrentTrack(queueRef.current[prevIndex]);
    setIsPlaying(true);
  }, []);

  const handleTrackEnded = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;

    // Repeat one: replay the same track
    if (repeatMode === 'one') {
      // Force re-render by setting track again
      const track = q[currentIndexRef.current];
      if (track) {
        setCurrentTrack(null);
        setTimeout(() => {
          setCurrentTrack(track);
          setIsPlaying(true);
        }, 100);
      }
      return;
    }

    const ci = currentIndexRef.current;
    const isLastTrack = ci >= q.length - 1;

    if (isLastTrack) {
      if (repeatMode === 'all') {
        // Loop back to the first track
        const nextIndex = shuffle ? Math.floor(Math.random() * q.length) : 0;
        setCurrentIndex(nextIndex);
        setCurrentTrack(q[nextIndex]);
        setIsPlaying(true);
      } else if (autoplay) {
        // If autoplay is on but no repeat, stop at the end
        setIsPlaying(false);
      }
      return;
    }

    // Not the last track: always advance if autoplay is on
    if (autoplay || repeatMode === 'all') {
      const nextIndex = getNextIndex();
      if (nextIndex >= 0) {
        setCurrentIndex(nextIndex);
        setCurrentTrack(q[nextIndex]);
        setIsPlaying(true);
      }
    }
  }, [repeatMode, autoplay, shuffle, getNextIndex]);

  const setQueue = useCallback((tracks: MusicTrackData[]) => {
    setQueueState(tracks);
    queueRef.current = tracks;
  }, []);

  const playPlaylist = useCallback((tracks: MusicTrackData[], startIndex = 0) => {
    setQueueState(tracks);
    queueRef.current = tracks;
    if (tracks.length > 0) {
      const idx = Math.min(startIndex, tracks.length - 1);
      setCurrentIndex(idx);
      currentIndexRef.current = idx;
      setCurrentTrack(tracks[idx]);
      setIsPlaying(true);
      setIsRobotOpen(true);
      setIsRobotMinimized(false);
    }
  }, []);

  const toggleRobot = useCallback(() => {
    if (isRobotMinimized) {
      setIsRobotMinimized(false);
      setIsRobotOpen(true);
    } else {
      setIsRobotMinimized(true);
    }
  }, [isRobotMinimized]);

  const minimizeRobot = useCallback(() => {
    setIsRobotMinimized(true);
  }, []);

  const expandRobot = useCallback(() => {
    setIsRobotMinimized(false);
    setIsRobotOpen(true);
  }, []);

  const toggleAutoplay = useCallback(() => {
    setAutoplay((prev) => !prev);
  }, []);

  const toggleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => !prev);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        isRobotOpen,
        isRobotMinimized,
        autoplay,
        repeatMode,
        shuffle,
        play,
        pause,
        resume,
        next,
        previous,
        setQueue,
        playPlaylist,
        toggleRobot,
        minimizeRobot,
        expandRobot,
        toggleAutoplay,
        toggleRepeatMode,
        toggleShuffle,
        handleTrackEnded,
        currentIndex,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}
