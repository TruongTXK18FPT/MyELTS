'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMusic } from '@/providers/MusicContext';
import { MusicEmbed } from './MusicEmbed';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Music2,
  ListMusic,
  Disc3,
  Repeat,
  Repeat1,
  Shuffle,
  Play,
  Pause,
} from 'lucide-react';

export function MusicRobot() {
  const {
    currentTrack,
    queue,
    isPlaying,
    isRobotOpen,
    isRobotMinimized,
    autoplay,
    repeatMode,
    shuffle,
    toggleRobot,
    minimizeRobot,
    next,
    previous,
    play,
    pause,
    resume,
    currentIndex,
    toggleAutoplay,
    toggleRepeatMode,
    toggleShuffle,
    handleTrackEnded,
  } = useMusic();

  const [showQueue, setShowQueue] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const [dragY, setDragY] = useState(0);
  const isDragging = useRef(false);

  // Swipe down to minimize on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    setDragY(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    touchDeltaY.current = delta;
    if (delta > 0) {
      setDragY(Math.min(delta, 200));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (touchDeltaY.current > 80) {
      minimizeRobot();
    }
    setDragY(0);
    touchDeltaY.current = 0;
  }, [minimizeRobot]);

  // Don't render anything if no track has ever been played
  if (!isRobotOpen && !currentTrack) return null;

  const repeatIcon = repeatMode === 'one' ? (
    <Repeat1 className="h-3.5 w-3.5" />
  ) : (
    <Repeat className="h-3.5 w-3.5" />
  );

  const repeatLabel = repeatMode === 'off' ? 'Tắt lặp' : repeatMode === 'all' ? 'Lặp tất cả' : 'Lặp 1 bài';

  return (
    <>
      {/* Minimized floating button */}
      {isRobotMinimized && (
        <div className="fixed bottom-4 right-4 z-[9999] sm:bottom-6 sm:right-6">
          <button
            onClick={toggleRobot}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 shadow-lg shadow-pink-300/50 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-pink-400/60 sm:h-14 sm:w-14"
          >
            {currentTrack && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-pink-400/30" style={{ animationDuration: '2s' }} />
                <span className="absolute inset-[-4px] animate-pulse rounded-full border-2 border-pink-300/40" style={{ animationDuration: '1.5s' }} />
              </>
            )}
            {currentTrack ? (
              <div className="flex items-end gap-[3px]">
                <span className="inline-block w-[3px] animate-bounce rounded-full bg-white" style={{ height: '12px', animationDelay: '0ms', animationDuration: '0.6s' }} />
                <span className="inline-block w-[3px] animate-bounce rounded-full bg-white" style={{ height: '18px', animationDelay: '150ms', animationDuration: '0.5s' }} />
                <span className="inline-block w-[3px] animate-bounce rounded-full bg-white" style={{ height: '10px', animationDelay: '300ms', animationDuration: '0.7s' }} />
                <span className="inline-block w-[3px] animate-bounce rounded-full bg-white" style={{ height: '16px', animationDelay: '100ms', animationDuration: '0.55s' }} />
              </div>
            ) : (
              <Music2 className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            )}
            {currentTrack && (
              <div className="absolute bottom-full right-0 mb-2 hidden max-w-[200px] rounded-xl bg-white/95 px-3 py-2 shadow-lg shadow-pink-100 backdrop-blur group-hover:block">
                <p className="truncate text-xs font-semibold text-gray-700">{currentTrack.title}</p>
                {currentTrack.artist && (
                  <p className="truncate text-[10px] text-pink-400">{currentTrack.artist}</p>
                )}
              </div>
            )}
          </button>
        </div>
      )}

      {/*
        Expanded panel - ALWAYS rendered when a track exists.
        When minimized, we move it off-screen with CSS so the iframe stays alive.
        On mobile, it takes full width at the bottom. On desktop, it's a fixed-width panel.
      */}
      {currentTrack && (
        <div
          ref={panelRef}
          className={`fixed z-[9999] w-full sm:w-[360px] sm:max-w-[calc(100vw-48px)] left-0 sm:left-auto ${
            isRobotMinimized
              ? 'pointer-events-none opacity-0 -bottom-full sm:-bottom-full sm:-right-full'
              : 'bottom-0 sm:bottom-6 sm:right-6'
          }`}
          style={{
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
            transition: isDragging.current ? 'none' : 'transform 0.3s ease, opacity 0.3s ease, bottom 0.3s ease',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden rounded-t-3xl border-t border-x border-pink-200/80 bg-white/95 shadow-2xl shadow-pink-200/40 backdrop-blur-xl sm:rounded-3xl sm:border">
            {/* Swipe indicator - mobile only */}
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-pink-200/80" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 px-4 py-2.5 sm:py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 sm:h-8 sm:w-8">
                  <Disc3 className="h-3.5 w-3.5 animate-spin text-white sm:h-4 sm:w-4" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white sm:text-sm">🎵 Music Robot</h4>
                  <p className="text-[9px] text-pink-100 sm:text-[10px]">Trạm phát nhạc MyELTS</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Autoplay badge */}
                <button
                  onClick={toggleAutoplay}
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold transition-colors sm:text-[10px] ${
                    autoplay
                      ? 'bg-white/25 text-white'
                      : 'bg-white/10 text-white/50'
                  }`}
                  title={autoplay ? 'Autoplay đang bật' : 'Autoplay đang tắt'}
                >
                  {autoplay ? '▶ Auto' : '⏸ Auto'}
                </button>
                <button
                  onClick={minimizeRobot}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
                >
                  <ChevronDown className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Player - always mounted so iframe persists */}
            <div className="p-2.5 sm:p-3">
              <MusicEmbed
                url={currentTrack.url}
                platform={currentTrack.platform}
                compact
                onEnded={handleTrackEnded}
              />

              <div className="mt-2.5 space-y-2 sm:mt-3">
                <div className="text-center">
                  <p className="truncate text-xs font-bold text-gray-800 sm:text-sm">{currentTrack.title}</p>
                  {currentTrack.artist && (
                    <p className="truncate text-[10px] text-pink-400 sm:text-xs">{currentTrack.artist}</p>
                  )}
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {/* Shuffle */}
                  <button
                    onClick={toggleShuffle}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      shuffle
                        ? 'bg-pink-100 text-pink-600'
                        : 'text-gray-400 hover:bg-pink-50 hover:text-pink-500'
                    }`}
                    title={shuffle ? 'Tắt xáo trộn' : 'Bật xáo trộn'}
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                  </button>

                  {/* Previous */}
                  <Button
                    onClick={previous}
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-pink-500 hover:bg-pink-50 hover:text-pink-600"
                    disabled={queue.length <= 1}
                  >
                    <SkipBack className="h-4 w-4" fill="currentColor" />
                  </Button>

                  {/* Play/Pause */}
                  <button
                    onClick={() => (isPlaying ? pause() : resume())}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-md shadow-pink-200 transition-transform hover:scale-105 active:scale-95 sm:h-11 sm:w-11"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 sm:h-5 sm:w-5" fill="white" />
                    ) : (
                      <Play className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" fill="white" />
                    )}
                  </button>

                  {/* Next */}
                  <Button
                    onClick={next}
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-pink-500 hover:bg-pink-50 hover:text-pink-600"
                    disabled={queue.length <= 1}
                  >
                    <SkipForward className="h-4 w-4" fill="currentColor" />
                  </Button>

                  {/* Repeat */}
                  <button
                    onClick={toggleRepeatMode}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      repeatMode !== 'off'
                        ? 'bg-pink-100 text-pink-600'
                        : 'text-gray-400 hover:bg-pink-50 hover:text-pink-500'
                    }`}
                    title={repeatLabel}
                  >
                    {repeatIcon}
                  </button>
                </div>

                {/* Track position indicator */}
                {queue.length > 1 && (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => setShowQueue(!showQueue)}
                      className="flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-[10px] font-semibold text-pink-500 transition-colors hover:bg-pink-100 sm:text-xs"
                    >
                      <ListMusic className="h-3 w-3" />
                      {currentIndex + 1} / {queue.length}
                      {showQueue ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronUp className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Queue - collapsible */}
            {queue.length > 1 && showQueue && (
              <div className="border-t border-pink-100 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 px-4 py-2">
                  <ListMusic className="h-3.5 w-3.5 text-pink-400" />
                  <span className="text-[10px] font-semibold text-pink-500 sm:text-xs">
                    Danh sách phát ({queue.length} bài)
                  </span>
                </div>
                <ScrollArea className="max-h-[30vh] sm:max-h-[160px]">
                  <div className="space-y-0.5 px-2 pb-2">
                    {queue.map((track, idx) => (
                      <button
                        key={track.id}
                        onClick={() => play(track)}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                          idx === currentIndex
                            ? 'bg-pink-100/80 text-pink-600'
                            : 'text-gray-600 hover:bg-pink-50'
                        }`}
                      >
                        {idx === currentIndex ? (
                          <div className="flex w-4 items-end justify-center gap-[2px]">
                            <span className="inline-block w-[2px] animate-bounce rounded-full bg-pink-500" style={{ height: '8px', animationDelay: '0ms' }} />
                            <span className="inline-block w-[2px] animate-bounce rounded-full bg-pink-500" style={{ height: '12px', animationDelay: '150ms' }} />
                            <span className="inline-block w-[2px] animate-bounce rounded-full bg-pink-500" style={{ height: '6px', animationDelay: '300ms' }} />
                          </div>
                        ) : (
                          <span className="w-4 text-center text-[10px] text-gray-400">
                            {idx + 1}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="block truncate text-xs font-medium">
                            {track.title}
                          </span>
                          {track.artist && (
                            <span className="block truncate text-[10px] text-pink-400/70">
                              {track.artist}
                            </span>
                          )}
                        </div>
                        {idx === currentIndex && (
                          <span className="text-[9px] font-bold text-pink-500">NOW</span>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
