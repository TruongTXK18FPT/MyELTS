'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Edit, Trash2, Headphones, Link as LinkIcon, RefreshCw, Youtube, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MusicTrack {
  id: string;
  title: string;
  url: string;
  platform: 'YOUTUBE' | 'SPOTIFY';
  platformId: string;
  thumbnail: string | null;
  artist: string | null;
  createdAt: string;
  addedBy?: {
    name: string | null;
    email: string | null;
  };
}

export default function AdminMusicPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Dialog controls
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [trackToEdit, setTrackToEdit] = useState<MusicTrack | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/music');
      if (!res.ok) throw new Error('Không thể tải danh sách bài hát.');
      const data = await res.json();
      setTracks(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setTrackToEdit(null);
    setUrl('');
    setTitle('');
    setArtist('');
    setThumbnail('');
    setIsOpenForm(true);
  };

  const handleOpenEdit = (track: MusicTrack) => {
    setIsEditMode(true);
    setTrackToEdit(track);
    setUrl(track.url);
    setTitle(track.title);
    setArtist(track.artist || '');
    setThumbnail(track.thumbnail || '');
    setIsOpenForm(true);
  };

  const handleOpenDelete = (track: MusicTrack) => {
    setTrackToEdit(track);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!url.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Đường dẫn bài hát là bắt buộc.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);

      if (isEditMode && trackToEdit) {
        // Edit Mode: Update title, artist, thumbnail
        const res = await fetch(`/api/admin/music/${trackToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, artist, url, thumbnail }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Cập nhật bài hát thất bại.');

        toast({
          title: 'Đã cập nhật',
          description: `Thông tin bài hát "${title}" đã được lưu.`,
        });
      } else {
        // Add Mode: Insert URL
        const res = await fetch('/api/admin/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Thêm bài hát thất bại.');

        toast({
          title: 'Thêm thành công',
          description: `Đã thêm bài hát "${data.title}" vào hệ thống.`,
        });
      }

      setIsOpenForm(false);
      fetchTracks();
    } catch (error: any) {
      toast({
        title: 'Thao tác thất bại',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!trackToEdit) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/music/${trackToEdit.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa bài hát thất bại.');

      toast({
        title: 'Đã xóa',
        description: 'Bài hát đã được gỡ khỏi hệ thống.',
      });

      setIsDeleteOpen(false);
      setTracks(tracks.filter((t) => t.id !== trackToEdit.id));
    } catch (error: any) {
      toast({
        title: 'Thất bại',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTracks = tracks.filter((track) => {
    const term = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(term) ||
      (track.artist && track.artist.toLowerCase().includes(term)) ||
      track.platform.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent">
            Quản lý Bài hát Lofi Luyện tập
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách nhạc nền lofi giúp học viên thư giãn và tập trung khi luyện nghe hoặc đọc IELTS.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Thêm bài nhạc mới
        </Button>
      </div>

      <Card className="border-[#F3D1E4] shadow-sm dark:border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">Thư viện âm nhạc ({filteredTracks.length})</CardTitle>
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm tiêu đề, tác giả, nền tảng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-pink-100 focus-visible:ring-pink-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Không tìm thấy bài hát nào phù hợp.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-pink-100 dark:border-gray-800">
              <Table>
                <TableHeader className="bg-pink-50/50 dark:bg-gray-800/20">
                  <TableRow>
                    <TableHead className="w-[80px] font-semibold">Ảnh bìa</TableHead>
                    <TableHead className="font-semibold">Tiêu đề bài hát</TableHead>
                    <TableHead className="font-semibold">Nghệ sĩ</TableHead>
                    <TableHead className="font-semibold">Nền tảng</TableHead>
                    <TableHead className="font-semibold">Đường dẫn</TableHead>
                    <TableHead className="text-right font-semibold">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTracks.map((track) => (
                    <TableRow key={track.id} className="hover:bg-pink-50/10">
                      <TableCell>
                        <div className="relative h-10 w-16 overflow-hidden rounded-md bg-gray-100 border border-gray-200">
                          {track.thumbnail ? (
                            <img src={track.thumbnail} alt={track.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-pink-100 text-pink-600">
                              <Headphones className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800 dark:text-gray-200">{track.title}</TableCell>
                      <TableCell className="text-xs text-gray-500">{track.artist || 'Không rõ nghệ sĩ'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          track.platform === 'YOUTUBE'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {track.platform === 'YOUTUBE' ? <Youtube className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          {track.platform}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-indigo-500 hover:underline">
                        <a href={track.url} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          {track.url}
                        </a>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(track)}
                          className="h-8 w-8 text-pink-600 hover:bg-pink-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(track)}
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpenForm} onOpenChange={setIsOpenForm}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Cập nhật thông tin bài hát' : 'Thêm bài hát mới'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Điều chỉnh tiêu đề, nghệ sĩ hoặc ảnh bìa thủ công.'
                : 'Nhập đường dẫn YouTube hoặc Spotify. Hệ thống sẽ tự động tìm nạp tiêu đề và tác giả.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="space-y-1">
              <Label htmlFor="murl">Đường dẫn URL bài nhạc <span className="text-red-500">*</span></Label>
              <Input
                id="murl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=..."
                className="border-pink-100"
                disabled={isEditMode}
              />
            </div>

            {isEditMode && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="mtitle">Tiêu đề bài hát</Label>
                  <Input
                    id="mtitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lofi Study Music"
                    className="border-pink-100"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="martist">Nghệ sĩ / Kênh</Label>
                  <Input
                    id="martist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. Lofi Girl"
                    className="border-pink-100"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mthumb">Đường dẫn ảnh bìa (Thumbnail URL)</Label>
                  <Input
                    id="mthumb"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="URL hình ảnh"
                    className="border-pink-100"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpenForm(false)}>Hủy</Button>
            <Button
              onClick={handleSave}
              disabled={actionLoading}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              {actionLoading ? 'Đang xử lý...' : isEditMode ? 'Lưu bài nhạc' : 'Tìm và Thêm nhạc'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa nhạc nền</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn gỡ bỏ bài hát "{trackToEdit?.title}" khỏi danh sách phát lofi của hệ thống?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? 'Đang xóa...' : 'Xóa bài nhạc'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
