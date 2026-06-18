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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Edit, Trash2, BookText, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface GrammarEntry {
  id: string;
  title: string;
  slug: string;
  grammarType: string | null;
  level: string | null;
  explanation: string;
  usageGuide: string | null;
  structurePattern: string | null;
  exampleSentence: string | null;
  storyExample: string | null;
  practiceHint: string | null;
  tags: string[];
  user?: {
    name: string | null;
    email: string | null;
  };
}

export default function AdminGrammarPage() {
  const [grammarList, setGrammarList] = useState<GrammarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Dialog control
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<GrammarEntry | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [grammarType, setGrammarType] = useState('');
  const [level, setLevel] = useState('');
  const [explanation, setExplanation] = useState('');
  const [usageGuide, setUsageGuide] = useState('');
  const [structurePattern, setStructurePattern] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [storyExample, setStoryExample] = useState('');
  const [practiceHint, setPracticeHint] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const fetchGrammar = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/grammar');
      if (!res.ok) throw new Error('Không thể tải giáo trình ngữ pháp.');
      const data = await res.json();
      setGrammarList(data);
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
    fetchGrammar();
  }, []);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEntryToEdit(null);
    resetForm();
    setIsOpenForm(true);
  };

  const handleOpenEdit = (entry: GrammarEntry) => {
    setIsEditMode(true);
    setEntryToEdit(entry);
    setTitle(entry.title);
    setGrammarType(entry.grammarType || '');
    setLevel(entry.level || '');
    setExplanation(entry.explanation || '');
    setUsageGuide(entry.usageGuide || '');
    setStructurePattern(entry.structurePattern || '');
    setExampleSentence(entry.exampleSentence || '');
    setStoryExample(entry.storyExample || '');
    setPracticeHint(entry.practiceHint || '');
    setTagsInput(entry.tags ? entry.tags.join(', ') : '');
    setIsOpenForm(true);
  };

  const handleOpenDelete = (entry: GrammarEntry) => {
    setEntryToEdit(entry);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setTitle('');
    setGrammarType('');
    setLevel('');
    setExplanation('');
    setUsageGuide('');
    setStructurePattern('');
    setExampleSentence('');
    setStoryExample('');
    setPracticeHint('');
    setTagsInput('');
  };

  const handleSave = async () => {
    if (!title.trim() || !explanation.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tên điểm ngữ pháp và nội dung giải thích cốt lõi.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title,
        grammarType: grammarType || null,
        level: level || null,
        explanation,
        usageGuide: usageGuide || null,
        structurePattern: structurePattern || null,
        exampleSentence: exampleSentence || null,
        storyExample: storyExample || null,
        practiceHint: practiceHint || null,
        tags,
      };

      const endpoint = isEditMode && entryToEdit ? `/api/admin/grammar/${entryToEdit.id}` : '/api/admin/grammar';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu điểm ngữ pháp thất bại.');

      toast({
        title: isEditMode ? 'Đã cập nhật' : 'Đã tạo thành công',
        description: `Bài học ngữ pháp "${title}" đã được ghi nhận.`,
      });

      setIsOpenForm(false);
      fetchGrammar();
    } catch (error: any) {
      toast({
        title: 'Lỗi thao tác',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entryToEdit) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/grammar/${entryToEdit.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa điểm ngữ pháp thất bại.');

      toast({
        title: 'Đã xóa bài học',
        description: `Bài học ngữ pháp đã bị xóa hoàn toàn khỏi hệ thống.`,
      });

      setIsDeleteOpen(false);
      fetchGrammar();
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

  const filteredGrammar = grammarList.filter((item) => {
    const term = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.grammarType && item.grammarType.toLowerCase().includes(term)) ||
      (item.level && item.level.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent">
            Quản lý Bài học Ngữ pháp
          </h1>
          <p className="text-sm text-muted-foreground">
            Thiết lập và quản lý các bài viết ngữ pháp, cấu trúc câu và các gợi ý luyện tập dành cho học viên IELTS.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Soạn bài viết mới
        </Button>
      </div>

      <Card className="border-[#F3D1E4] shadow-sm dark:border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">Tất cả điểm ngữ pháp ({filteredGrammar.length})</CardTitle>
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm tên ngữ pháp, phân loại, cấp bậc..."
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
          ) : filteredGrammar.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Chưa có bài học ngữ pháp nào trong hệ thống.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-pink-100 dark:border-gray-800">
              <Table>
                <TableHeader className="bg-pink-50/50 dark:bg-gray-800/20">
                  <TableRow>
                    <TableHead className="font-semibold">Điểm Ngữ pháp</TableHead>
                    <TableHead className="font-semibold">Phân loại (Type)</TableHead>
                    <TableHead className="font-semibold">Cấp bậc (Level)</TableHead>
                    <TableHead className="font-semibold">Từ khóa (Tags)</TableHead>
                    <TableHead className="font-semibold">Người viết</TableHead>
                    <TableHead className="text-right font-semibold">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrammar.map((item) => (
                    <TableRow key={item.id} className="hover:bg-pink-50/10">
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <BookText className="h-4 w-4 text-pink-500" />
                          <span>{item.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.grammarType || 'Chung'}</TableCell>
                      <TableCell>
                        <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
                          {item.level || 'Chưa chia'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {item.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="rounded bg-pink-100/50 px-1.5 py-0.2 text-[10px] text-pink-600 dark:bg-pink-950/20 dark:text-pink-400">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{item.user?.name || 'Admin'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 text-pink-600 hover:bg-pink-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(item)}
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

      {/* Write / Edit Dialog */}
      <Dialog open={isOpenForm} onOpenChange={setIsOpenForm}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Biên soạn bài viết ngữ pháp' : 'Soạn điểm ngữ pháp mới'}</DialogTitle>
            <DialogDescription>
              Soạn thảo cấu trúc ngữ pháp kèm theo giải thích cụ thể và ví dụ mẫu IELTS.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="gtitle">Tên điểm ngữ pháp <span className="text-red-500">*</span></Label>
                <Input
                  id="gtitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Present Perfect Continuous"
                  className="border-pink-100"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="glevel">Cấp bậc (Level)</Label>
                <Input
                  id="glevel"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g. Intermediate, B2"
                  className="border-pink-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gtype">Phân loại (Type)</Label>
                <Input
                  id="gtype"
                  value={grammarType}
                  onChange={(e) => setGrammarType(e.target.value)}
                  placeholder="e.g. Tenses, Passive Voice"
                  className="border-pink-100"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gtags">Thẻ từ khóa (phân cách bằng dấu phẩy)</Label>
                <Input
                  id="gtags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. grammar, writing, band6"
                  className="border-pink-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="gpattern">Công thức cấu trúc (Structure Pattern)</Label>
              <Input
                id="gpattern"
                value={structurePattern}
                onChange={(e) => setStructurePattern(e.target.value)}
                placeholder="e.g. S + have/has + been + V-ing"
                className="border-pink-100"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="gexpl">Giải thích ngữ pháp <span className="text-red-500">*</span></Label>
              <Textarea
                id="gexpl"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Viết phần diễn giải chi tiết về cách dùng, dấu hiệu nhận biết..."
                className="border-pink-100 min-h-24"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="gguide">Hướng dẫn sử dụng chi tiết (Usage Guide)</Label>
              <Textarea
                id="gguide"
                value={usageGuide}
                onChange={(e) => setUsageGuide(e.target.value)}
                placeholder="Mẹo dùng đặc biệt, phân biệt với cấu trúc tương tự..."
                className="border-pink-100 min-h-20"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="gex">Câu ví dụ (Example Sentence)</Label>
              <Textarea
                id="gex"
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                placeholder="Nhập các câu ví dụ mẫu kèm dịch nghĩa..."
                className="border-pink-100 min-h-20"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="gstory">Câu chuyện / Bối cảnh ví dụ (Story Example)</Label>
              <Textarea
                id="gstory"
                value={storyExample}
                onChange={(e) => setStoryExample(e.target.value)}
                placeholder="Viết một đoạn văn ngắn hoặc bối cảnh sinh động để ghi nhớ..."
                className="border-pink-100 min-h-20"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ghint">Gợi ý ôn tập & luyện tập (Practice Hint)</Label>
              <Textarea
                id="ghint"
                value={practiceHint}
                onChange={(e) => setPracticeHint(e.target.value)}
                placeholder="Gợi ý câu hỏi tự luyện tập..."
                className="border-pink-100 min-h-16"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsOpenForm(false)}>Hủy</Button>
            <Button
              onClick={handleSave}
              disabled={actionLoading}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              {actionLoading ? 'Đang lưu...' : 'Lưu bài viết'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xóa bài học ngữ pháp?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bài học ngữ pháp "{entryToEdit?.title}"? Học viên sẽ không thể học bài viết này trên trang ôn luyện nữa.
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
