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
    <div className="group relative overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm transition-all duration-300 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/60 hover:-translate-y-1">
      {/* Thumbnail / Embed */}
      {expanded ? (
        <MusicEmbed url={track.url} platform={track.platform} compact />
      ) : (
        <div
          className="relative cursor-pointer overflow-hidden"
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
              <Music className="h-12 w-12 text-pink-300" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
            <div className="flex h-14 w-14 scale-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 shadow-xl transition-all duration-300 group-hover:scale-100">
              <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
            </div>
          </div>

          {/* Platform badge */}
          <div className="absolute left-2 top-2">
            {track.platform === 'YOUTUBE' ? (
              <div className="flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                <Youtube className="h-3 w-3" />
                YouTube
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                <Music className="h-3 w-3" />
                Spotify
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        <h4 className="mb-1 line-clamp-2 text-sm font-bold text-gray-800 transition-colors group-hover:text-pink-600">
          {track.title}
        </h4>
        {track.artist && (
          <p className="mb-2 text-xs text-pink-400">{track.artist}</p>
        )}

        {/* Added by */}
        <div className="mb-3 flex items-center gap-1.5 text-[11px] text-gray-400">
          <User className="h-3 w-3" />
          <span>{track.addedBy?.name || 'Ẩn danh'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePlay}
            size="sm"
            className="h-8 flex-1 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-xs font-semibold text-white shadow-sm hover:from-pink-500 hover:to-rose-500"
          >
            <Play className="mr-1 h-3.5 w-3.5" fill="white" />
            Phát
          </Button>

          {onAddToPlaylist && (
            <Button
              onClick={() => onAddToPlaylist(track)}
              size="sm"
              variant="outline"
              className="h-8 rounded-xl border-pink-200 text-xs text-pink-500 hover:bg-pink-50 hover:text-pink-600"
            >
              <ListPlus className="h-3.5 w-3.5" />
            </Button>
          )}

          {isOwner && (
            <Button
              onClick={handleDelete}
              size="sm"
              variant="outline"
              disabled={deleting}
              className="h-8 rounded-xl border-pink-200 text-xs text-pink-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
