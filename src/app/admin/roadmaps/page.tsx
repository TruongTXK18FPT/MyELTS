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
import { useToast } from '@/hooks/use-toast';
import { Search, Map, Eye, Trash2, Clock, Calendar, BookOpen, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  name: string | null;
  email: string | null;
}

interface RoadmapPlan {
  id: string;
  userId: string;
  status: string;
  targetBandScore: number;
  availableTimePerWeek: number;
  studyMaterialsPreference: string | null;
  skillGaps: string | null;
  estimatedTimeline: string;
  weeklyStudyPlanText: string;
  suggestedResourcesText: string;
  createdAt: string;
  user: User;
}

export default function AdminRoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<RoadmapPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Dialog controls
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapPlan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/roadmaps');
      if (!res.ok) throw new Error('Không thể lấy danh sách lộ trình.');
      const data = await res.json();
      setRoadmaps(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi đồng bộ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const handleOpenDetail = (roadmap: RoadmapPlan) => {
    setSelectedRoadmap(roadmap);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (roadmap: RoadmapPlan) => {
    setSelectedRoadmap(roadmap);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRoadmap) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/roadmaps/${selectedRoadmap.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa lộ trình học thất bại.');

      toast({
        title: 'Đã xóa lộ trình',
        description: `Lộ trình học của học viên ${selectedRoadmap.user.email} đã được dọn dẹp.`,
      });

      setIsDeleteOpen(false);
      setRoadmaps(roadmaps.filter((r) => r.id !== selectedRoadmap.id));
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

  const filteredRoadmaps = roadmaps.filter((roadmap) => {
    const term = searchQuery.toLowerCase();
    const userName = roadmap.user?.name?.toLowerCase() || '';
    const userEmail = roadmap.user?.email?.toLowerCase() || '';
    const timeline = roadmap.estimatedTimeline?.toLowerCase() || '';
    return userName.includes(term) || userEmail.includes(term) || timeline.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent">
            Lộ trình IELTS Học viên
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi chi tiết tất cả các kế hoạch ôn luyện IELTS do AI xây dựng dựa trên kết quả bài test đầu vào.
          </p>
        </div>
        <Button onClick={fetchRoadmaps} variant="outline" size="sm" className="border-pink-200 text-pink-600 hover:bg-pink-50">
          <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
        </Button>
      </div>

      <Card className="border-[#F3D1E4] shadow-sm dark:border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">Tất cả lộ trình học ({filteredRoadmaps.length})</CardTitle>
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm tên, email học viên, thời lượng..."
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
          ) : filteredRoadmaps.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Không tìm thấy lộ trình học nào phù hợp.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-pink-100 dark:border-gray-800">
              <Table>
                <TableHeader className="bg-pink-50/50 dark:bg-gray-800/20">
                  <TableRow>
                    <TableHead className="font-semibold">Học viên</TableHead>
                    <TableHead className="font-semibold">Mục tiêu Band</TableHead>
                    <TableHead className="font-semibold">Thời lượng ôn tập</TableHead>
                    <TableHead className="font-semibold">Thời hạn ước tính</TableHead>
                    <TableHead className="font-semibold">Trạng thái</TableHead>
                    <TableHead className="font-semibold">Ngày khởi tạo</TableHead>
                    <TableHead className="text-right font-semibold">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoadmaps.map((roadmap) => (
                    <TableRow key={roadmap.id} className="hover:bg-pink-50/10">
                      <TableCell>
                        <div>
                          <div className="font-semibold text-gray-800 dark:text-gray-200">
                            {roadmap.user?.name || 'Học viên'}
                          </div>
                          <div className="text-xs text-gray-400">{roadmap.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-pink-600 dark:text-pink-400">Band {roadmap.targetBandScore}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {roadmap.availableTimePerWeek} giờ / tuần
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {roadmap.estimatedTimeline}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          roadmap.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {roadmap.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(roadmap.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetail(roadmap)}
                          className="h-8 w-8 text-pink-600 hover:bg-pink-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(roadmap)}
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-pink-500" />
              Chi tiết Lộ trình IELTS AI
            </DialogTitle>
            <DialogDescription>
              Kế hoạch học tập chi tiết của học viên {selectedRoadmap?.user.name} ({selectedRoadmap?.user.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            {/* Meta */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-pink-100 bg-pink-50/20 p-3 text-xs dark:border-gray-800">
              <div>
                <span className="block text-gray-400">Mục tiêu Band:</span>
                <span className="font-bold text-pink-600 dark:text-pink-400 text-sm">Band {selectedRoadmap?.targetBandScore}</span>
              </div>
              <div>
                <span className="block text-gray-400">Tự học mỗi tuần:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedRoadmap?.availableTimePerWeek} giờ</span>
              </div>
              <div>
                <span className="block text-gray-400">Thời gian ước lượng:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedRoadmap?.estimatedTimeline}</span>
              </div>
            </div>

            {/* Skill Gaps */}
            {selectedRoadmap?.skillGaps && (
              <div className="space-y-1">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Lỗ hổng kỹ năng cần bù đắp:</span>
                <p className="rounded-lg bg-red-50/50 p-2.5 text-xs text-red-700 border border-red-100 dark:bg-red-950/20 dark:border-red-950">
                  {selectedRoadmap.skillGaps}
                </p>
              </div>
            )}

            {/* Study preferences */}
            {selectedRoadmap?.studyMaterialsPreference && (
              <div className="space-y-1">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Sở thích học tập:</span>
                <p className="rounded-lg bg-indigo-50/40 p-2.5 text-xs text-indigo-700 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-950">
                  {selectedRoadmap.studyMaterialsPreference}
                </p>
              </div>
            )}

            {/* Weekly study plan */}
            <div className="space-y-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <Calendar className="h-4 w-4 text-pink-500" />
                Lịch trình học hàng tuần:
              </span>
              <pre className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-sans text-gray-700 whitespace-pre-wrap leading-relaxed dark:border-gray-800 dark:bg-zinc-900 dark:text-gray-300">
                {selectedRoadmap?.weeklyStudyPlanText}
              </pre>
            </div>

            {/* Suggested resources */}
            {selectedRoadmap?.suggestedResourcesText && (
              <div className="space-y-1">
                <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-pink-500" />
                  Tài liệu đề xuất sử dụng:
                </span>
                <pre className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-sans text-gray-700 whitespace-pre-wrap leading-relaxed dark:border-gray-800 dark:bg-zinc-900 dark:text-gray-300">
                  {selectedRoadmap.suggestedResourcesText}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa lộ trình</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa lộ trình ôn tập này? Học viên sẽ bị mất lộ trình học hiện tại và sẽ cần tạo lại lộ trình mới.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
