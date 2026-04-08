'use client';

import { TrackCard } from './TrackCard';
import { type MusicTrackData } from '@/providers/MusicContext';
import { Music2, Disc3 } from 'lucide-react';

interface TrackGridProps {
  tracks: MusicTrackData[];
  onDelete?: () => void;
  onAddToPlaylist?: (track: MusicTrackData) => void;
  loading?: boolean;
}

export function TrackGrid({ tracks, onDelete, onAddToPlaylist, loading }: TrackGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-pink-100 bg-white">
            <div className="aspect-video w-full bg-pink-50" />
            <div className="space-y-2 p-3 sm:p-4">
              <div className="h-4 w-3/4 rounded-full bg-pink-100" />
              <div className="h-3 w-1/2 rounded-full bg-pink-50" />
              <div className="h-8 w-full rounded-xl bg-pink-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-pink-200 bg-pink-50/50 py-12 sm:py-16">
        <div className="relative mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-rose-200 sm:h-20 sm:w-20">
            <Music2 className="h-8 w-8 text-pink-400 sm:h-10 sm:w-10" />
          </div>
          <Disc3 className="absolute -bottom-1 -right-1 h-6 w-6 animate-spin text-pink-300 sm:h-8 sm:w-8" style={{ animationDuration: '3s' }} />
        </div>
        <h3 className="mb-1 text-base font-bold text-pink-600 sm:text-lg">Chưa có bài nhạc nào</h3>
        <p className="px-4 text-center text-xs text-pink-400 sm:text-sm">Hãy thêm bài nhạc đầu tiên bằng link YouTube hoặc Spotify nhé! 🎶</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          onDelete={onDelete}
          onAddToPlaylist={onAddToPlaylist}
        />
      ))}
    </div>
  );
}
