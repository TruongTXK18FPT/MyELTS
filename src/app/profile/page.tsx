'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useRef, useEffect } from 'react';
import { Camera, LogOut, UploadCloud, UserCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [stats, setStats] = useState({ vocabCount: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch user stats
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/user/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {}
    };
    if (session?.user) fetchStats();
  }, [session]);

  if (!session?.user) {
    return <div className="p-8 text-center">Vui lòng đăng nhập...</div>;
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setAvatarPreview(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'myelts/avatars');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();

      // Update Database
      const updateRes = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url })
      });

      if (updateRes.ok) {
        await update({ image: url });
        setAvatarPreview(url);
      }
    } catch (err) {
      console.error(err);
      alert("Cập nhật avatar thất bại");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const currentAvatar = avatarPreview || session.user.image || '';

  return (
    <div className="container max-w-4xl mx-auto p-4 py-12">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin cá nhân */}
        <Card className="md:col-span-1 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-center">
              <div className="relative inline-flex">
              <Avatar className="w-32 h-32 border-4 border-primary">
                <AvatarImage src={currentAvatar} alt={session.user.name || 'User'} className="object-cover" />
                <AvatarFallback className="text-4xl text-primary bg-primary/10">
                  {session.user.name?.charAt(0) || <UserCircle className="w-16 h-16" />}
                </AvatarFallback>
              </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-primary p-2 text-white shadow-md transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Đổi avatar</span>
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Nhấn biểu tượng máy ảnh để thay avatar</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>
            <CardTitle>{session.user.name}</CardTitle>
            <CardDescription>{session.user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut({ callbackUrl: '/auth/login' })}>
              <LogOut className="w-4 h-4" /> Đăng xuất
            </Button>
          </CardContent>
        </Card>

        {/* Cột phải: Thống kê và Quản lý */}
        <Card className="md:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BookOpen className="text-primary" /> Tổng quan học tập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground uppercase font-semibold">Từ vựng đã thêm</p>
                <h3 className="text-4xl font-bold text-primary mt-2">{stats.vocabCount}</h3>
              </div>
              {/* Có thể thêm thống kê điểm bài tập sau này */}
            </div>

            <div className="mt-8 space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Hành động nhanh</h4>
              <Link href="/vocabulary">
                <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] transition-transform text-white py-6">
                  <UploadCloud className="w-5 h-5 mr-2" />
                  Mở trang Vocabulary
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
