'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, ListMusic, Sparkles, ImagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MusicTrackData } from '@/providers/MusicContext';

interface PlaylistManagerProps {
  playlists: Array<{
    id: string;
    name: string;
    _count: { tracks: number };
  }>;
  onPlaylistCreated?: () => void;
  onTrackAddedToPlaylist?: () => void;
  trackToAdd?: MusicTrackData | null;
  onClearTrackToAdd?: () => void;
}

export function PlaylistManager({
  playlists,
  onPlaylistCreated,
  onTrackAddedToPlaylist,
  trackToAdd,
  onClearTrackToAdd,
}: PlaylistManagerProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [addToOpen, setAddToOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [addingTrack, setAddingTrack] = useState(false);

  // Cover image state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open add-to-playlist dialog when trackToAdd changes
  useEffect(() => {
    if (trackToAdd) {
      setAddToOpen(true);
    }
  }, [trackToAdd]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: '❌ Chỉ chấp nhận file ảnh', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: '❌ Ảnh phải nhỏ hơn 5MB', variant: 'destructive' });
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverFile) return null;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', coverFile);
      formData.append('folder', 'myelts/playlists');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } catch {
      toast({ title: '❌ Lỗi upload ảnh', variant: 'destructive' });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !name.trim()) return;

    setLoading(true);
    try {
      // Upload cover image first if selected
      let coverImage: string | null = null;
      if (coverFile) {
        coverImage = await uploadCoverImage();
      }

      const res = await fetch('/api/music/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, coverImage }),
      });

      if (res.ok) {
        toast({ title: '🎵 Tạo playlist thành công!' });
        setName('');
        setDescription('');
        removeCover();
        setCreateOpen(false);
        onPlaylistCreated?.();
      } else {
        const data = await res.json();
        toast({ title: '❌ Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ Lỗi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async () => {
    if (!trackToAdd || !selectedPlaylistId) return;

    setAddingTrack(true);
    try {
      const res = await fetch(`/api/music/playlists/${selectedPlaylistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: trackToAdd.id }),
      });

      if (res.ok) {
        toast({ title: '✅ Đã thêm vào playlist!' });
        setAddToOpen(false);
        setSelectedPlaylistId('');
        onClearTrackToAdd?.();
        onTrackAddedToPlaylist?.();
      } else {
        const data = await res.json();
        toast({ title: '❌ Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ Lỗi', variant: 'destructive' });
    } finally {
      setAddingTrack(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Create Playlist Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button className="h-10 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 text-sm font-semibold text-white shadow-md shadow-pink-200 hover:from-pink-500 hover:to-rose-500">
            <Plus className="mr-2 h-4 w-4" />
            Tạo Playlist
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-3xl border-pink-200 bg-gradient-to-b from-white to-pink-50/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-pink-600">
              <Sparkles className="h-5 w-5" />
              Tạo Playlist Mới
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            {/* Cover Image Upload */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Ảnh bìa <span className="text-gray-400">(tuỳ chọn)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {coverPreview ? (
                <div className="relative overflow-hidden rounded-2xl border-2 border-pink-200">
                  <div className="relative aspect-[2/1] w-full">
                    <Image
                      src={coverPreview}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeCover}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 py-8 text-sm text-pink-400 transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-500"
                >
                  <ImagePlus className="h-5 w-5" />
                  Chọn ảnh bìa cho playlist
                </button>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Tên playlist</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhạc học bài chill..."
                className="h-11 rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Mô tả <span className="text-gray-400">(tuỳ chọn)</span>
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Playlist nhạc thư giãn khi ôn thi IELTS 🎧"
                className="h-11 rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-200"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || uploadingImage || !name.trim()}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 font-semibold text-white shadow-md shadow-pink-200 hover:from-pink-500 hover:to-rose-500"
            >
              {loading || uploadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingImage ? 'Đang tải ảnh...' : 'Đang tạo...'}
                </>
              ) : (
                <>
                  <ListMusic className="mr-2 h-4 w-4" />
                  Tạo Playlist
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add to Playlist Dialog */}
      {trackToAdd && (
        <Dialog
          open={addToOpen}
          onOpenChange={(open) => {
            setAddToOpen(open);
            if (!open) onClearTrackToAdd?.();
          }}
        >
          <DialogContent className="max-w-md rounded-3xl border-pink-200 bg-gradient-to-b from-white to-pink-50/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-pink-600">
                <ListMusic className="h-5 w-5" />
                Thêm vào Playlist
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-pink-100 bg-pink-50/50 p-3">
                <p className="text-sm font-semibold text-gray-700">{trackToAdd.title}</p>
                {trackToAdd.artist && (
                  <p className="text-xs text-pink-400">{trackToAdd.artist}</p>
                )}
              </div>

              {playlists.length === 0 ? (
                <div className="rounded-xl border border-pink-100 bg-pink-50/30 p-4 text-center">
                  <p className="text-sm text-pink-400">Chưa có playlist nào</p>
                  <p className="mt-1 text-xs text-gray-400">Hãy tạo playlist trước nhé!</p>
                </div>
              ) : (
                <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                  <SelectTrigger className="h-11 rounded-xl border-pink-200">
                    <SelectValue placeholder="Chọn playlist..." />
                  </SelectTrigger>
                  <SelectContent>
                    {playlists.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.name} ({pl._count.tracks} bài)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                onClick={handleAddToPlaylist}
                disabled={addingTrack || !selectedPlaylistId || playlists.length === 0}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 font-semibold text-white shadow-md shadow-pink-200 hover:from-pink-500 hover:to-rose-500"
              >
                {addingTrack ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Thêm vào Playlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
