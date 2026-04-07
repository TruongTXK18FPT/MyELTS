'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMusic, type MusicTrackData } from '@/providers/MusicContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Play, Music2, User, ListMusic, Trash2, Pencil, ImagePlus, X, Loader2, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    description: string | null;
    coverImage: string | null;
    createdById: string;
    createdBy: { id: string; name: string | null; image: string | null };
    tracks: Array<{
      track: MusicTrackData;
    }>;
    _count: { tracks: number };
  };
  onDelete?: () => void;
  onUpdate?: () => void;
}

export function PlaylistCard({ playlist, onDelete, onUpdate }: PlaylistCardProps) {
  const { data: session } = useSession();
  const { playPlaylist } = useMusic();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [editDescription, setEditDescription] = useState(playlist.description || '');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(playlist.coverImage);
  const [removedCover, setRemovedCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const isOwner = session?.user?.id === playlist.createdById;
  const trackCount = playlist._count.tracks;
  const tracks = (playlist.tracks || []).map((pt) => pt.track);

  const handlePlay = () => {
    if (tracks.length === 0) {
      toast({ title: '🎵 Playlist trống', description: 'Chưa có bài nhạc nào trong playlist' });
      return;
    }
    playPlaylist(tracks);
  };

  const handleDelete = async () => {
    if (!confirm(`Xóa playlist "${playlist.name}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/music/playlists/${playlist.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: '🗑️ Đã xóa playlist' });
        onDelete?.();
      }
    } catch {
      toast({ title: '❌ Lỗi', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setEditCoverFile(file);
    setRemovedCover(false);
    const reader = new FileReader();
    reader.onloadend = () => setEditCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeEditCover = () => {
    setEditCoverFile(null);
    setEditCoverPreview(null);
    setRemovedCover(true);
    if (editFileRef.current) editFileRef.current.value = '';
  };

  const openEditDialog = () => {
    setEditName(playlist.name);
    setEditDescription(playlist.description || '');
    setEditCoverPreview(playlist.coverImage);
    setEditCoverFile(null);
    setRemovedCover(false);
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setSaving(true);
    try {
      // Upload new cover if selected
      let coverImage: string | null | undefined = undefined;
      if (editCoverFile) {
        const formData = new FormData();
        formData.append('file', editCoverFile);
        formData.append('folder', 'myelts/playlists');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          coverImage = uploadData.url;
        }
      } else if (removedCover) {
        coverImage = null;
      }

      const body: Record<string, unknown> = {
        name: editName.trim(),
        description: editDescription.trim() || null,
      };
      if (coverImage !== undefined) {
        body.coverImage = coverImage;
      }

      const res = await fetch(`/api/music/playlists/${playlist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({ title: '✅ Đã cập nhật playlist!' });
        setEditOpen(false);
        onUpdate?.();
      } else {
        const data = await res.json();
        toast({ title: '❌ Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ Lỗi', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Generate gradient from playlist name for unique look
  const hue = playlist.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 60 + 320;

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm transition-all duration-300 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/60 hover:-translate-y-1">
        {/* Cover */}
        <div
          className="relative flex aspect-[2/1] items-center justify-center overflow-hidden"
          style={{
            background: playlist.coverImage
              ? undefined
              : `linear-gradient(135deg, hsl(${hue}, 70%, 85%) 0%, hsl(${hue + 20}, 80%, 75%) 50%, hsl(${hue + 40}, 70%, 80%) 100%)`,
          }}
        >
          {playlist.coverImage ? (
            <Image
              src={playlist.coverImage}
              alt={playlist.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <ListMusic className="h-10 w-10 text-white/80" />
                <span className="text-2xl font-bold text-white/90">{trackCount}</span>
              </div>
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
              <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/10" />
              <div className="absolute right-8 bottom-4 h-8 w-8 rounded-full bg-white/15" />
            </>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
            <div
              onClick={handlePlay}
              className="flex h-12 w-12 scale-0 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-lg transition-all duration-300 group-hover:scale-100"
            >
              <Play className="h-5 w-5 text-pink-500 ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        <div className="p-4">
          <h4 className="mb-1 text-sm font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
            {playlist.name}
          </h4>
          {playlist.description && (
            <p className="mb-2 line-clamp-2 text-xs text-gray-400">{playlist.description}</p>
          )}

          <div className="mb-3 flex items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Music2 className="h-3 w-3" />
              {trackCount} bài
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {playlist.createdBy.name || 'Ẩn danh'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePlay}
              size="sm"
              className="h-8 flex-1 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-xs font-semibold text-white shadow-sm hover:from-pink-500 hover:to-rose-500"
            >
              <Play className="mr-1 h-3.5 w-3.5" fill="white" />
              Phát tất cả
            </Button>

            {isOwner && (
              <>
                <Button
                  onClick={openEditDialog}
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl border-pink-200 text-xs text-pink-400 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl border-pink-200 text-xs text-pink-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Playlist Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-3xl border-pink-200 bg-gradient-to-b from-white to-pink-50/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-pink-600">
              <Pencil className="h-5 w-5" />
              Chỉnh sửa Playlist
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {/* Cover Image */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Ảnh bìa
              </label>
              <input
                ref={editFileRef}
                type="file"
                accept="image/*"
                onChange={handleEditFileSelect}
                className="hidden"
              />
              {editCoverPreview ? (
                <div className="relative overflow-hidden rounded-2xl border-2 border-pink-200">
                  <div className="relative aspect-[2/1] w-full">
                    <Image
                      src={editCoverPreview}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => editFileRef.current?.click()}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={removeEditCover}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => editFileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 py-6 text-sm text-pink-400 transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-500"
                >
                  <ImagePlus className="h-5 w-5" />
                  Chọn ảnh bìa
                </button>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Tên playlist</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Tên playlist..."
                className="h-11 rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Mô tả <span className="text-gray-400">(tuỳ chọn)</span>
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Mô tả playlist..."
                className="h-11 rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-200"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving || !editName.trim()}
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 font-semibold text-white shadow-md shadow-pink-200 hover:from-pink-500 hover:to-rose-500"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
