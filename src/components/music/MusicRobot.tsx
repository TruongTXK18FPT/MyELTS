'use client';

import { useMusic } from '@/providers/MusicContext';
import { MusicEmbed } from './MusicEmbed';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SkipBack,
  SkipForward,
  ChevronDown,
  Music2,
  ListMusic,
  Disc3,
} from 'lucide-react';

export function MusicRobot() {
  const {
    currentTrack,
    queue,
    isRobotOpen,
    isRobotMinimized,
    toggleRobot,
    minimizeRobot,
    next,
    previous,
    play,
    currentIndex,
  } = useMusic();

  // Don't render anything if no track has ever been played
  if (!isRobotOpen && !currentTrack) return null;

  return (
    <>
      {/* Minimized floating button */}
      {isRobotMinimized && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <button
            onClick={toggleRobot}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 shadow-lg shadow-pink-300/50 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-pink-400/60"
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
              <Music2 className="h-6 w-6 text-white" />
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
      */}
      {currentTrack && (
        <div
          className="fixed z-[9999] w-[360px] max-w-[calc(100vw-48px)]"
          style={{
            bottom: isRobotMinimized ? '-9999px' : '24px',
            right: isRobotMinimized ? '-9999px' : '24px',
            pointerEvents: isRobotMinimized ? 'none' : 'auto',
            opacity: isRobotMinimized ? 0 : 1,
          }}
        >
          <div className="overflow-hidden rounded-3xl border border-pink-200/80 bg-white/95 shadow-2xl shadow-pink-200/40 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Disc3 className="h-4 w-4 animate-spin text-white" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">🎵 Music Robot</h4>
                  <p className="text-[10px] text-pink-100">Trạm phát nhạc MyELTS</p>
                </div>
              </div>
              <button
                onClick={minimizeRobot}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
              >
                <ChevronDown className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Player - always mounted so iframe persists */}
            <div className="p-3">
              <MusicEmbed url={currentTrack.url} platform={currentTrack.platform} compact />

              <div className="mt-3 space-y-2">
                <div className="text-center">
                  <p className="truncate text-sm font-bold text-gray-800">{currentTrack.title}</p>
                  {currentTrack.artist && (
                    <p className="truncate text-xs text-pink-400">{currentTrack.artist}</p>
                  )}
                </div>

                {queue.length > 1 && (
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={previous}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 rounded-full text-pink-500 hover:bg-pink-50 hover:text-pink-600"
                    >
                      <SkipBack className="h-4 w-4" fill="currentColor" />
                    </Button>
                    <div className="flex h-8 items-center gap-1 rounded-full bg-pink-50 px-3">
                      <span className="text-xs font-semibold text-pink-600">
                        {currentIndex + 1} / {queue.length}
                      </span>
                    </div>
                    <Button
                      onClick={next}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 rounded-full text-pink-500 hover:bg-pink-50 hover:text-pink-600"
                    >
                      <SkipForward className="h-4 w-4" fill="currentColor" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Queue */}
            {queue.length > 1 && (
              <div className="border-t border-pink-100">
                <div className="flex items-center gap-2 px-4 py-2">
                  <ListMusic className="h-3.5 w-3.5 text-pink-400" />
                  <span className="text-xs font-semibold text-pink-500">
                    Danh sách phát ({queue.length} bài)
                  </span>
                </div>
                <ScrollArea className="max-h-[160px]">
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
                          <div className="flex items-end gap-[2px]">
                            <span className="inline-block w-[2px] animate-bounce rounded-full bg-pink-500" style={{ height: '8px', animationDelay: '0ms' }} />
                            <span className="inline-block w-[2px] animate-bounce rounded-full bg-pink-500" style={{ height: '12px', animationDelay: '150ms' }} />
                            <span className="inline-block w-[2px] animate-bounce rounded-full bg-pink-500" style={{ height: '6px', animationDelay: '300ms' }} />
                          </div>
                        ) : (
                          <span className="w-4 text-center text-[10px] text-gray-400">
                            {idx + 1}
                          </span>
                        )}
                        <span className="flex-1 truncate text-xs font-medium">
                          {track.title}
                        </span>
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
