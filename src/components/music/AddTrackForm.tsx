'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseMusicUrl } from '@/lib/music-utils';
import { Music, Youtube, Loader2, Plus, Sparkles, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MusicEmbed } from './MusicEmbed';

interface AddTrackFormProps {
  onTrackAdded?: () => void;
}

export function AddTrackForm({ onTrackAdded }: AddTrackFormProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ platform: 'YOUTUBE' | 'SPOTIFY'; url: string } | null>(null);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    const parsed = parseMusicUrl(value);
    if (parsed) {
      setPreview({ platform: parsed.platform, url: value });
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast({
        title: '⚠️ Chưa đăng nhập',
        description: 'Bạn cần đăng nhập để thêm nhạc',
        variant: 'destructive',
      });
      return;
    }

    if (!url.trim()) return;

    const parsed = parseMusicUrl(url);
    if (!parsed) {
      toast({
        title: '❌ Link không hợp lệ',
        description: 'Vui lòng nhập link YouTube hoặc Spotify hợp lệ',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/music/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: '❌ Lỗi',
          description: data.error || 'Không thể thêm nhạc',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: '🎵 Thêm nhạc thành công!',
        description: `"${data.title}" đã được thêm vào hệ thống`,
      });

      setUrl('');
      setPreview(null);
      onTrackAdded?.();
    } catch {
      toast({
        title: '❌ Lỗi',
        description: 'Đã xảy ra lỗi khi thêm nhạc',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const detectedPlatform = parseMusicUrl(url)?.platform;

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-pink-200/60 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 shadow-lg shadow-pink-100/50">
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-pink-200/30 blur-2xl" />
      <div className="absolute -left-4 bottom-0 h-16 w-16 rounded-full bg-rose-200/30 blur-2xl" />

      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-md shadow-pink-200">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Thêm nhạc mới</h3>
            <p className="text-xs text-pink-400">Dán link YouTube hoặc Spotify</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {detectedPlatform === 'YOUTUBE' ? (
                <Youtube className="h-5 w-5 text-red-500" />
              ) : detectedPlatform === 'SPOTIFY' ? (
                <Music className="h-5 w-5 text-green-500" />
              ) : (
                <Link2 className="h-5 w-5 text-pink-300" />
              )}
            </div>
            <Input
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://youtube.com/watch?v=... hoặc https://open.spotify.com/track/..."
              className="h-12 rounded-2xl border-pink-200 bg-white/80 pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-pink-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-200"
              disabled={loading}
            />
          </div>

          {preview && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="mb-2 text-xs font-medium text-pink-500">📺 Xem trước:</p>
              <MusicEmbed url={preview.url} platform={preview.platform} compact />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !url.trim() || !detectedPlatform}
            className="h-11 w-full rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-sm font-semibold text-white shadow-md shadow-pink-200 transition-all hover:from-pink-500 hover:via-rose-500 hover:to-pink-600 hover:shadow-lg hover:shadow-pink-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang thêm...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Thêm vào trạm nhạc
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
