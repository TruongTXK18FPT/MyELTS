'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getYouTubeEmbedUrl, getSpotifyEmbedUrl, extractYouTubeId, extractSpotifyId } from '@/lib/music-utils';

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        element: string | HTMLElement,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YTPlayer {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  loadVideoById: (videoId: string) => void;
}

interface MusicEmbedProps {
  url: string;
  platform: 'YOUTUBE' | 'SPOTIFY';
  compact?: boolean;
  className?: string;
  onEnded?: () => void;
}

// Track if API script is loaded
let ytApiLoaded = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiReady) {
      resolve();
      return;
    }

    ytReadyCallbacks.push(resolve);

    if (!ytApiLoaded) {
      ytApiLoaded = true;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(tag, firstScript);

      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        ytReadyCallbacks.forEach((cb) => cb());
        ytReadyCallbacks.length = 0;
      };
    }
  });
}

export function MusicEmbed({ url, platform, compact = false, className = '', onEnded }: MusicEmbedProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);

  // Keep callback ref updated
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const initYouTubePlayer = useCallback((videoId: string) => {
    // Clean up previous player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        // Player already destroyed
      }
      playerRef.current = null;
    }

    if (!containerRef.current) return;

    // Create a fresh div for the player
    const playerDiv = document.createElement('div');
    playerDiv.id = `yt-player-${videoId}-${Date.now()}`;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(playerDiv);

    loadYouTubeAPI().then(() => {
      if (!containerRef.current) return;

      try {
        playerRef.current = new window.YT.Player(playerDiv.id, {
          videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onStateChange: (event) => {
              // State 0 = ENDED
              if (event.data === 0) {
                onEndedRef.current?.();
              }
            },
            onError: () => {
              // On error, also trigger ended to skip to next
              onEndedRef.current?.();
            },
          },
        });
      } catch (err) {
        console.error('Failed to init YT player:', err);
      }
    });
  }, []);

  // Effect for YouTube
  useEffect(() => {
    if (platform !== 'YOUTUBE') return;

    const videoId = extractYouTubeId(url);
    if (!videoId) return;

    initYouTubePlayer(videoId);

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Silent cleanup
        }
        playerRef.current = null;
      }
    };
  }, [url, platform, initYouTubePlayer]);

  if (platform === 'YOUTUBE') {
    const videoId = extractYouTubeId(url);
    if (!videoId) return <div className="text-sm text-muted-foreground">Invalid YouTube URL</div>;

    return (
      <div className={`relative overflow-hidden rounded-2xl bg-black/5 ${className}`}>
        <div className={`relative ${compact ? 'aspect-video max-h-[180px]' : 'aspect-video'} w-full`}>
          <div
            ref={containerRef}
            className="absolute inset-0 h-full w-full rounded-2xl [&>iframe]:!h-full [&>iframe]:!w-full [&>iframe]:!rounded-2xl"
          />
        </div>
      </div>
    );
  }

  if (platform === 'SPOTIFY') {
    const spotify = extractSpotifyId(url);
    if (!spotify) return <div className="text-sm text-muted-foreground">Invalid Spotify URL</div>;

    const embedUrl = getSpotifyEmbedUrl(spotify.id, spotify.type);
    return (
      <div className={`relative overflow-hidden rounded-2xl ${className}`}>
        <iframe
          src={embedUrl}
          className="w-full rounded-2xl"
          height={compact ? 152 : 352}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify player"
          style={{ border: 'none' }}
        />
      </div>
    );
  }

  return null;
}
