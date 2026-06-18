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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Vocab {
  id: string;
  word: string;
  pronunciation: string | null;
  meaning: string | null;
  category: string | null;
  example: string | null;
  usageContext: string | null;
  note: string | null;
  synonym: string | null;
  antonym: string | null;
  singularForm: string | null;
  pluralForm: string | null;
  v2Form: string | null;
  v3Form: string | null;
  createdAt: string;
}

export default function AdminVocabPage() {
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const { toast } = useToast();

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Dialog control
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [vocabToEdit, setVocabToEdit] = useState<Vocab | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [category, setCategory] = useState('');
  const [example, setExample] = useState('');
  const [usageContext, setUsageContext] = useState('');
  const [note, setNote] = useState('');
  const [synonym, setSynonym] = useState('');
  const [antonym, setAntonym] = useState('');
  const [singularForm, setSingularForm] = useState('');
  const [pluralForm, setPluralForm] = useState('');
  const [v2Form, setV2Form] = useState('');
  const [v3Form, setV3Form] = useState('');

  const fetchVocabList = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/vocab', window.location.origin);
      url.searchParams.set('search', search);
      url.searchParams.set('category', selectedCategory);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '12');

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Không thể lấy danh sách từ vựng.');
      const data = await res.json();
      setVocabs(data.vocabs);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
      setCategoriesList(data.categories || []);
    } catch (error: any) {
      toast({
        title: 'Lỗi tải từ vựng',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabList();
  }, [page, selectedCategory]);

  const triggerSearch = () => {
    setPage(1);
    fetchVocabList();
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setVocabToEdit(null);
    resetForm();
    setIsOpenForm(true);
  };

  const handleOpenEdit = (vocab: Vocab) => {
    setIsEditMode(true);
    setVocabToEdit(vocab);
    setWord(vocab.word);
    setMeaning(vocab.meaning || '');
    setPronunciation(vocab.pronunciation || '');
    setCategory(vocab.category || '');
    setExample(vocab.example || '');
    setUsageContext(vocab.usageContext || '');
    setNote(vocab.note || '');
    setSynonym(vocab.synonym || '');
    setAntonym(vocab.antonym || '');
    setSingularForm(vocab.singularForm || '');
    setPluralForm(vocab.pluralForm || '');
    setV2Form(vocab.v2Form || '');
    setV3Form(vocab.v3Form || '');
    setIsOpenForm(true);
  };

  const handleOpenDelete = (vocab: Vocab) => {
    setVocabToEdit(vocab);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setWord('');
    setMeaning('');
    setPronunciation('');
    setCategory('');
    setExample('');
    setUsageContext('');
    setNote('');
    setSynonym('');
    setAntonym('');
    setSingularForm('');
    setPluralForm('');
    setV2Form('');
    setV3Form('');
  };

  const handleSave = async () => {
    if (!word.trim() || !meaning.trim()) {
      toast({
        title: 'Thiếu thông tin 🌸',
        description: 'Vui lòng nhập từ vựng và nghĩa tiếng Việt.',
        variant: 'warning',
      });
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        word,
        meaning,
        pronunciation: pronunciation || null,
        category: category || null,
        example: example || null,
        usageContext: usageContext || null,
        note: note || null,
        synonym: synonym || null,
        antonym: antonym || null,
        singularForm: singularForm || null,
        pluralForm: pluralForm || null,
        v2Form: v2Form || null,
        v3Form: v3Form || null,
      };

      const endpoint = isEditMode && vocabToEdit ? `/api/admin/vocab/${vocabToEdit.id}` : '/api/admin/vocab';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu từ vựng thất bại.');

      toast({
        title: isEditMode ? 'Đã cập nhật 🎉' : 'Đã thêm thành công 🌸',
        description: `Từ vựng "${word}" đã được ghi nhận.`,
        variant: 'success',
      });

      setIsOpenForm(false);
      fetchVocabList();
    } catch (error: any) {
      toast({
        title: 'Thao tác thất bại 🥺',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!vocabToEdit) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/vocab/${vocabToEdit.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa từ vựng thất bại.');

      toast({
        title: 'Đã xóa thành công 🌸',
        description: `Đã xóa từ vựng khỏi hệ thống.`,
        variant: 'success',
      });

      setIsDeleteOpen(false);
      fetchVocabList();
    } catch (error: any) {
      toast({
        title: 'Lỗi 🥺',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/vocab', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa toàn bộ từ vựng thất bại.');

      toast({
        title: 'Đã xóa toàn bộ 🌸',
        description: data.message || 'Hệ thống từ vựng đã được dọn sạch.',
        variant: 'success',
      });

      setIsBulkDeleteOpen(false);
      setPage(1);
      fetchVocabList();
    } catch (error: any) {
      toast({
        title: 'Lỗi dọn dẹp hệ thống 🥺',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent">
            Quản lý Từ vựng Hệ thống
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách tất cả các từ vựng học viên đã nhập hoặc từ vựng mặc định. Thêm mới, sửa, hoặc dọn sạch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleOpenAdd} className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Thêm từ vựng
          </Button>
          <Button
            onClick={() => setIsBulkDeleteOpen(true)}
            variant="destructive"
            className="rounded-xl bg-red-600 hover:bg-red-700"
          >
            <AlertTriangle className="mr-2 h-4 w-4" /> Xóa tất cả
          </Button>
        </div>
      </div>

      <Card className="border-[#F3D1E4] shadow-sm dark:border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2 max-w-sm">
              <Input
                type="text"
                placeholder="Tìm từ vựng, ý nghĩa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                className="border-pink-100 focus-visible:ring-pink-500"
              />
              <Button onClick={triggerSearch} variant="secondary" className="bg-pink-50 text-pink-600 hover:bg-pink-100">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-pink-500" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-pink-100 bg-white px-3 py-2 text-sm text-[#3A3A3A] focus:border-pink-500 focus:outline-none dark:border-gray-800 dark:bg-zinc-900 dark:text-gray-100"
              >
                <option value="">Tất cả Chủ đề (Category)</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : vocabs.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Không tìm thấy từ vựng nào.</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-pink-100 dark:border-gray-800">
                <Table>
                  <TableHeader className="bg-pink-50/50 dark:bg-gray-800/20">
                    <TableRow>
                      <TableHead className="font-semibold">Từ vựng</TableHead>
                      <TableHead className="font-semibold">Phiên âm</TableHead>
                      <TableHead className="font-semibold">Chủ đề</TableHead>
                      <TableHead className="font-semibold">Nghĩa tiếng Việt</TableHead>
                      <TableHead className="font-semibold">Ví dụ</TableHead>
                      <TableHead className="text-right font-semibold">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vocabs.map((vocab) => (
                      <TableRow key={vocab.id} className="hover:bg-pink-50/10">
                        <TableCell className="font-bold text-pink-600 dark:text-pink-400">{vocab.word}</TableCell>
                        <TableCell className="text-gray-500 font-mono text-xs">{vocab.pronunciation || '-'}</TableCell>
                        <TableCell>
                          <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-semibold text-pink-600 dark:bg-pink-950/20 dark:text-pink-400">
                            {vocab.category || 'Chung'}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{vocab.meaning || '-'}</TableCell>
                        <TableCell className="max-w-[240px] truncate text-xs text-gray-500 italic">{vocab.example || '-'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(vocab)}
                            className="h-8 w-8 text-pink-600 hover:bg-pink-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(vocab)}
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

              {/* Pagination controls */}
              <div className="flex items-center justify-between border-t border-[#FCE4EC] pt-4 dark:border-gray-800">
                <span className="text-xs text-gray-500">
                  Hiển thị từ vựng thứ <strong>{(page - 1) * 12 + 1}</strong> đến <strong>{Math.min(page * 12, totalItems)}</strong> trong tổng số <strong>{totalItems}</strong> từ.
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center px-3 text-xs font-medium border border-gray-200 rounded-lg bg-gray-50">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Form Dialog */}
      <Dialog open={isOpenForm} onOpenChange={setIsOpenForm}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Cập nhật từ vựng' : 'Thêm từ vựng mới'}</DialogTitle>
            <DialogDescription>
              Điền đầy đủ thông tin từ vựng tiếng Anh để hỗ trợ việc học của học viên.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="vword">Từ vựng <span className="text-red-500">*</span></Label>
                <Input id="vword" value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g. Magnificent" className="border-pink-100" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vpron">Phiên âm</Label>
                <Input id="vpron" value={pronunciation} onChange={(e) => setPronunciation(e.target.value)} placeholder="e.g. /mæɡˈnɪf.ɪ.sənt/" className="border-pink-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="vcat">Chủ đề (Category)</Label>
                <Input id="vcat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Travel, Science" className="border-pink-100" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vmean">Nghĩa tiếng Việt <span className="text-red-500">*</span></Label>
                <Input id="vmean" value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="e.g. Tuyệt vời, tráng lệ" className="border-pink-100" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="vex">Ví dụ sử dụng</Label>
              <Textarea id="vex" value={example} onChange={(e) => setExample(e.target.value)} placeholder="Nhập câu ví dụ kèm bản dịch..." className="border-pink-100 min-h-16" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="vctx">Bối cảnh sử dụng</Label>
              <Input id="vctx" value={usageContext} onChange={(e) => setUsageContext(e.target.value)} placeholder="e.g. Formal, Academic, Speaking" className="border-pink-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="vsyn">Từ đồng nghĩa</Label>
                <Input id="vsyn" value={synonym} onChange={(e) => setSynonym(e.target.value)} placeholder="e.g. splendid, grand" className="border-pink-100" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vant">Từ trái nghĩa</Label>
                <Input id="vant" value={antonym} onChange={(e) => setAntonym(e.target.value)} placeholder="e.g. humble, poor" className="border-pink-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-pink-50 pt-2">
              <div className="space-y-1">
                <Label htmlFor="vsing">Số ít Form</Label>
                <Input id="vsing" value={singularForm} onChange={(e) => setSingularForm(e.target.value)} className="border-pink-100" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vplur">Số nhiều Form</Label>
                <Input id="vplur" value={pluralForm} onChange={(e) => setPluralForm(e.target.value)} className="border-pink-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="vv2">Động từ V2</Label>
                <Input id="vv2" value={v2Form} onChange={(e) => setV2Form(e.target.value)} className="border-pink-100" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vv3">Động từ V3</Label>
                <Input id="vv3" value={v3Form} onChange={(e) => setV3Form(e.target.value)} className="border-pink-100" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="vnote">Ghi chú thêm</Label>
              <Input id="vnote" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú mở rộng..." className="border-pink-100" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsOpenForm(false)}>Hủy</Button>
            <Button
              onClick={handleSave}
              disabled={actionLoading}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              {actionLoading ? 'Đang lưu...' : 'Lưu từ vựng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa từ vựng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa từ vựng "{vocabToEdit?.word}" khỏi hệ thống dữ liệu? Học viên sẽ không thể học từ này nữa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button
              onClick={handleDeleteSingle}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? 'Đang xóa...' : 'Xóa từ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              XÓA TOÀN BỘ TỪ VỰNG?
            </DialogTitle>
            <DialogDescription>
              HÀNH ĐỘNG CỰC KỲ NGUY HIỂM! Toàn bộ kho từ vựng hiện có trên hệ thống sẽ bị xóa sạch hoàn toàn. Các học viên sẽ mất hết tất cả từ vựng đang theo dõi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsBulkDeleteOpen(false)}>Hủy bỏ</Button>
            <Button
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {actionLoading ? 'Đang dọn dẹp...' : 'Tôi chấp nhận, xóa sạch!'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
