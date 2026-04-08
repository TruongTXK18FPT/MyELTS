'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMusic, type MusicTrackData } from '@/providers/MusicContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Play, Music2, User, ListMusic, Trash2, Pencil, ImagePlus, X, Loader2, Save, Plus } from 'lucide-react';
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
  const initialPlaylistTracks = useMemo(
    () => (playlist.tracks || []).map((playlistTrack) => playlistTrack.track),
    [playlist.tracks]
  );
  const [playlistTracks, setPlaylistTracks] = useState<MusicTrackData[]>(initialPlaylistTracks);
  const [libraryTracks, setLibraryTracks] = useState<MusicTrackData[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [trackSearch, setTrackSearch] = useState('');
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [addingTracks, setAddingTracks] = useState(false);
  const [removingTrackIds, setRemovingTrackIds] = useState<string[]>([]);

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
  const trackCount = playlistTracks.length;
  const availableTracks = useMemo(() => {
    const currentTrackIds = new Set(playlistTracks.map((track) => track.id));
    return libraryTracks.filter((track) => !currentTrackIds.has(track.id));
  }, [libraryTracks, playlistTracks]);
  const filteredAvailableTracks = useMemo(() => {
    const keyword = trackSearch.trim().toLowerCase();
    if (!keyword) return availableTracks;

    return availableTracks.filter((track) => {
      const title = track.title.toLowerCase();
      const artist = (track.artist || '').toLowerCase();
      return title.includes(keyword) || artist.includes(keyword);
    });
  }, [availableTracks, trackSearch]);

  useEffect(() => {
    setPlaylistTracks(initialPlaylistTracks);
  }, [initialPlaylistTracks]);

  useEffect(() => {
    if (!editOpen || !isOwner) return;

    let isCancelled = false;

    const fetchLibraryTracks = async () => {
      setLoadingLibrary(true);
      try {
        const res = await fetch('/api/music/tracks?limit=200');
        const data = await res.json();
        if (!isCancelled) {
          setLibraryTracks(Array.isArray(data?.tracks) ? data.tracks : []);
        }
      } catch {
        if (!isCancelled) {
          toast({ title: '❌ Lỗi', description: 'Không tải được danh sách bài nhạc', variant: 'destructive' });
        }
      } finally {
        if (!isCancelled) {
          setLoadingLibrary(false);
        }
      }
    };

    void fetchLibraryTracks();

    return () => {
      isCancelled = true;
    };
  }, [editOpen, isOwner, toast]);

  const handlePlay = () => {
    if (playlistTracks.length === 0) {
      toast({ title: '🎵 Playlist trống', description: 'Chưa có bài nhạc nào trong playlist' });
      return;
    }
    playPlaylist(playlistTracks);
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
    setSelectedTrackIds([]);
    setTrackSearch('');
    setEditOpen(true);
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const selectAllFilteredTracks = () => {
    if (filteredAvailableTracks.length === 0) return;

    setSelectedTrackIds((prev) => {
      const selected = new Set(prev);
      for (const track of filteredAvailableTracks) {
        selected.add(track.id);
      }
      return Array.from(selected);
    });
  };

  const clearSelectedTracks = () => {
    setSelectedTrackIds([]);
  };

  const handleAddSelectedTracks = async () => {
    if (selectedTrackIds.length === 0) return;

    setAddingTracks(true);
    try {
      const res = await fetch(`/api/music/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIds: selectedTrackIds }),
      });

      const data = await res.json();

      if (res.ok) {
        const addedTracks: MusicTrackData[] = Array.isArray(data?.addedTracks)
          ? data.addedTracks
              .map((item: { track?: MusicTrackData } | MusicTrackData) =>
                'track' in item && item.track ? item.track : item
              )
              .filter((item: MusicTrackData | undefined): item is MusicTrackData => Boolean(item?.id))
          : libraryTracks.filter((track) => selectedTrackIds.includes(track.id));

        setPlaylistTracks((prev) => {
          const unique = new Map(prev.map((track) => [track.id, track]));
          for (const track of addedTracks) {
            unique.set(track.id, track);
          }
          return Array.from(unique.values());
        });

        setSelectedTrackIds([]);
        onUpdate?.();
        toast({
          title: '✅ Đã thêm vào playlist',
          description: `Đã thêm ${addedTracks.length || data?.addedCount || 0} bài nhạc`,
        });
      } else {
        toast({ title: '❌ Lỗi', description: data.error || 'Không thể thêm bài nhạc', variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ Lỗi', description: 'Không thể thêm bài nhạc', variant: 'destructive' });
    } finally {
      setAddingTracks(false);
    }
  };

  const handleRemoveTrackFromPlaylist = async (trackId: string) => {
    setRemovingTrackIds((prev) => [...prev, trackId]);
    try {
      const res = await fetch(`/api/music/playlists/${playlist.id}/tracks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });

      if (res.ok) {
        setPlaylistTracks((prev) => prev.filter((track) => track.id !== trackId));
        setSelectedTrackIds((prev) => prev.filter((id) => id !== trackId));
        onUpdate?.();
        toast({ title: '🗑️ Đã xóa bài khỏi playlist' });
      } else {
        const data = await res.json();
        toast({ title: '❌ Lỗi', description: data.error || 'Không thể xóa bài nhạc', variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ Lỗi', description: 'Không thể xóa bài nhạc', variant: 'destructive' });
    } finally {
      setRemovingTrackIds((prev) => prev.filter((id) => id !== trackId));
    }
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
        <DialogContent className="w-[95vw] max-w-2xl rounded-3xl border-pink-200 bg-gradient-to-b from-white to-pink-50/40 p-0 shadow-xl">
          <DialogHeader className="border-b border-pink-100 px-6 pb-4 pt-5">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-pink-600">
              <Pencil className="h-5 w-5" />
              Chỉnh sửa Playlist
            </DialogTitle>
            <p className="mt-1 text-xs text-gray-500">
              Cập nhật thông tin và quản lý bài hát trong cùng một cửa sổ.
            </p>
          </DialogHeader>

          <form onSubmit={handleSave} className="max-h-[78vh] space-y-4 overflow-y-auto px-6 py-4">
            <input
              ref={editFileRef}
              type="file"
              accept="image/*"
              onChange={handleEditFileSelect}
              className="hidden"
            />

            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Tên playlist</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Tên playlist..."
                    className="h-10 rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-200"
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
                    className="h-10 rounded-xl border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-pink-100 bg-white/80 p-2.5">
                <p className="mb-2 text-xs font-semibold text-gray-600">Ảnh bìa</p>

                {editCoverPreview ? (
                  <>
                    <div className="relative h-28 w-full overflow-hidden rounded-xl border border-pink-100">
                      <Image
                        src={editCoverPreview}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => editFileRef.current?.click()}
                        className="h-8 flex-1 rounded-lg border-pink-200 text-xs text-pink-500 hover:bg-pink-50"
                      >
                        <ImagePlus className="mr-1 h-3.5 w-3.5" />
                        Đổi
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={removeEditCover}
                        className="h-8 flex-1 rounded-lg border-pink-200 text-xs text-pink-500 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Gỡ
                      </Button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileRef.current?.click()}
                    className="flex h-28 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/50 text-xs font-medium text-pink-500 transition-all hover:border-pink-300 hover:bg-pink-50"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Chọn ảnh bìa
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-pink-100 bg-white/80 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-600">Bài trong playlist</p>
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-semibold text-pink-500">
                    {playlistTracks.length}
                  </span>
                </div>

                {playlistTracks.length === 0 ? (
                  <p className="text-xs text-gray-400">Playlist chưa có bài nào.</p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {playlistTracks.map((track) => {
                      const isRemoving = removingTrackIds.includes(track.id);

                      return (
                        <div
                          key={track.id}
                          className="flex items-center gap-2 rounded-xl border border-pink-100 bg-pink-50/50 p-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-700">{track.title}</p>
                            {track.artist && <p className="truncate text-xs text-pink-400">{track.artist}</p>}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isRemoving}
                            onClick={() => handleRemoveTrackFromPlaylist(track.id)}
                            className="h-7 w-7 rounded-lg border-pink-200 p-0 text-pink-500 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                          >
                            {isRemoving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-pink-100 bg-white/80 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-600">Thêm bài vào playlist</p>
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-semibold text-pink-500">
                    {selectedTrackIds.length} chọn
                  </span>
                </div>

                <Input
                  value={trackSearch}
                  onChange={(e) => setTrackSearch(e.target.value)}
                  placeholder="Tìm theo tên bài hoặc nghệ sĩ..."
                  className="mb-2 h-9 rounded-lg border-pink-200 text-xs focus:border-pink-400 focus:ring-pink-200"
                />

                <div className="mb-2 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={selectAllFilteredTracks}
                    disabled={filteredAvailableTracks.length === 0}
                    className="h-7 rounded-lg border-pink-200 px-2 text-[11px] text-pink-500 hover:bg-pink-50"
                  >
                    Chọn tất cả
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearSelectedTracks}
                    disabled={selectedTrackIds.length === 0}
                    className="h-7 rounded-lg border-pink-200 px-2 text-[11px] text-pink-500 hover:bg-pink-50"
                  >
                    Bỏ chọn
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddSelectedTracks}
                    disabled={addingTracks || selectedTrackIds.length === 0}
                    className="ml-auto h-7 rounded-lg bg-gradient-to-r from-pink-400 to-rose-400 px-2.5 text-[11px] font-semibold text-white hover:from-pink-500 hover:to-rose-500"
                  >
                    {addingTracks ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="mr-1 h-3 w-3" />
                    )}
                    Thêm
                  </Button>
                </div>

                {loadingLibrary ? (
                  <p className="text-xs text-gray-400">Đang tải danh sách bài nhạc...</p>
                ) : filteredAvailableTracks.length === 0 ? (
                  <p className="text-xs text-gray-400">Không có bài phù hợp để thêm.</p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {filteredAvailableTracks.map((track) => {
                      const isSelected = selectedTrackIds.includes(track.id);

                      return (
                        <label
                          key={track.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 transition-colors ${
                            isSelected
                              ? 'border-pink-300 bg-pink-100/70'
                              : 'border-pink-100 bg-pink-50/50 hover:border-pink-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTrackSelection(track.id)}
                            className="h-4 w-4 accent-pink-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-700">{track.title}</p>
                            {track.artist && <p className="truncate text-xs text-pink-400">{track.artist}</p>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-pink-100 pt-3">
              <Button
                type="submit"
                disabled={saving || !editName.trim()}
                className="h-10 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 px-5 font-semibold text-white shadow-md shadow-pink-200 hover:from-pink-500 hover:to-rose-500"
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
