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

interface MusicContextType {
  currentTrack: MusicTrackData | null;
  queue: MusicTrackData[];
  isPlaying: boolean;
  isRobotOpen: boolean;
  isRobotMinimized: boolean;
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
  const queueRef = useRef<MusicTrackData[]>([]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

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

  const next = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const nextIndex = (currentIndex + 1) % queueRef.current.length;
    setCurrentIndex(nextIndex);
    setCurrentTrack(queueRef.current[nextIndex]);
    setIsPlaying(true);
  }, [currentIndex]);

  const previous = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const prevIndex = currentIndex <= 0 ? queueRef.current.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentTrack(queueRef.current[prevIndex]);
    setIsPlaying(true);
  }, [currentIndex]);

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

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        isRobotOpen,
        isRobotMinimized,
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
