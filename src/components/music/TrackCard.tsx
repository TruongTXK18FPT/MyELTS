'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useMusic, type MusicTrackData } from '@/providers/MusicContext';
import { Play, Trash2, Youtube, Music, User, ListPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MusicEmbed } from './MusicEmbed';

interface TrackCardProps {
  track: MusicTrackData;
  onDelete?: () => void;
  onAddToPlaylist?: (track: MusicTrackData) => void;
  showEmbed?: boolean;
}

export function TrackCard({ track, onDelete, onAddToPlaylist, showEmbed = false }: TrackCardProps) {
  const { data: session } = useSession();
  const { play, setQueue } = useMusic();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(showEmbed);

  const handlePlay = () => {
    play(track);
    setExpanded(true);
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài nhạc này?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/music/tracks/${track.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: '🗑️ Đã xóa bài nhạc' });
        onDelete?.();
      } else {
        const data = await res.json();
        toast({ title: '❌ Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ Lỗi', description: 'Không thể xóa', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = session?.user?.id === track.addedBy?.id;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm transition-all duration-300 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/60 sm:hover:-translate-y-1">
      {/* Thumbnail / Embed */}
      {expanded ? (
        <MusicEmbed url={track.url} platform={track.platform} compact />
      ) : (
        <div
          className="relative cursor-pointer overflow-hidden active:opacity-90"
          onClick={handlePlay}
        >
          {track.thumbnail ? (
            <div className="relative aspect-video w-full">
              <Image
                src={track.thumbnail}
                alt={track.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-pink-100 to-rose-100">
              <Music className="h-10 w-10 text-pink-300 sm:h-12 sm:w-12" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
            <div className="flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 opacity-80 shadow-xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 sm:h-14 sm:w-14 sm:scale-0">
              <Play className="ml-0.5 h-5 w-5 text-white sm:h-6 sm:w-6" fill="white" />
            </div>
          </div>

          {/* Platform badge */}
          <div className="absolute left-2 top-2">
            {track.platform === 'YOUTUBE' ? (
              <div className="flex items-center gap-1 rounded-full bg-red-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm sm:px-2 sm:py-1 sm:text-[10px]">
                <Youtube className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">YouTube</span>
                <span className="sm:hidden">YT</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-green-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm sm:px-2 sm:py-1 sm:text-[10px]">
                <Music className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Spotify
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-3 sm:p-4">
        <h4 className="mb-1 line-clamp-2 text-xs font-bold text-gray-800 transition-colors group-hover:text-pink-600 sm:text-sm">
          {track.title}
        </h4>
        {track.artist && (
          <p className="mb-1.5 text-[10px] text-pink-400 sm:mb-2 sm:text-xs">{track.artist}</p>
        )}

        {/* Added by */}
        <div className="mb-2.5 flex items-center gap-1.5 text-[10px] text-gray-400 sm:mb-3 sm:text-[11px]">
          <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          <span>{track.addedBy?.name || 'Ẩn danh'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            onClick={handlePlay}
            size="sm"
            className="h-7 flex-1 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-[10px] font-semibold text-white shadow-sm hover:from-pink-500 hover:to-rose-500 sm:h-8 sm:text-xs"
          >
            <Play className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" fill="white" />
            Phát
          </Button>

          {onAddToPlaylist && (
            <Button
              onClick={() => onAddToPlaylist(track)}
              size="sm"
              variant="outline"
              className="h-7 rounded-xl border-pink-200 text-[10px] text-pink-500 hover:bg-pink-50 hover:text-pink-600 sm:h-8 sm:text-xs"
            >
              <ListPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          )}

          {isOwner && (
            <Button
              onClick={handleDelete}
              size="sm"
              variant="outline"
              disabled={deleting}
              className="h-7 rounded-xl border-pink-200 text-[10px] text-pink-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 sm:h-8 sm:text-xs"
            >
              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
