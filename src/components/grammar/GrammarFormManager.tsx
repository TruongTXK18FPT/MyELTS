'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogIn,
  PlusCircle,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { GrammarItem } from './types';

type GrammarFormManagerProps = {
  initialGrammar: GrammarItem[];
};

type GrammarFormState = {
  title: string;
  grammarType: string;
  level: string;
  explanation: string;
  usageGuide: string;
  structurePattern: string;
  exampleSentence: string;
  storyExample: string;
  practiceHint: string;
  tagsText: string;
};

type StatusState = {
  type: 'success' | 'error';
  message: string;
};

const initialFormState: GrammarFormState = {
  title: '',
  grammarType: '',
  level: '',
  explanation: '',
  usageGuide: '',
  structurePattern: '',
  exampleSentence: '',
  storyExample: '',
  practiceHint: '',
  tagsText: '',
};

function toFormState(item?: GrammarItem | null): GrammarFormState {
  if (!item) {
    return initialFormState;
  }

  return {
    title: item.title || '',
    grammarType: item.grammarType || '',
    level: item.level || '',
    explanation: item.explanation || '',
    usageGuide: item.usageGuide || '',
    structurePattern: item.structurePattern || '',
    exampleSentence: item.exampleSentence || '',
    storyExample: item.storyExample || '',
    practiceHint: item.practiceHint || '',
    tagsText: item.tags.join(', '),
  };
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function mapItemFromApi(payload: any): GrammarItem {
  return {
    id: payload.id,
    title: payload.title,
    slug: payload.slug,
    grammarType: payload.grammarType,
    level: payload.level,
    explanation: payload.explanation,
    usageGuide: payload.usageGuide,
    structurePattern: payload.structurePattern,
    exampleSentence: payload.exampleSentence,
    storyExample: payload.storyExample,
    practiceHint: payload.practiceHint,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    isSeed: Boolean(payload.isSeed),
    createdAt: payload.createdAt,
  };
}

export function GrammarFormManager({ initialGrammar }: GrammarFormManagerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedIdFromQuery = searchParams.get('id');

  const [grammar, setGrammar] = useState<GrammarItem[]>(initialGrammar);
  const [manageSearch, setManageSearch] = useState('');
  const [form, setForm] = useState<GrammarFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedItem = useMemo(
    () => (editingId ? grammar.find((item) => item.id === editingId) || null : null),
    [editingId, grammar]
  );

  const visibleGrammar = useMemo(() => {
    const q = manageSearch.trim().toLowerCase();

    return [...grammar]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .filter((item) => {
        if (!q) {
          return true;
        }

        const blob = [
          item.title,
          item.grammarType,
          item.level,
          item.explanation,
          item.usageGuide,
          item.structurePattern,
          item.tags.join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return blob.includes(q);
      });
  }, [grammar, manageSearch]);

  useEffect(() => {
    if (!selectedIdFromQuery) {
      setEditingId(null);
      setForm(initialFormState);
      return;
    }

    const found = grammar.find((item) => item.id === selectedIdFromQuery);

    if (!found) {
      setStatus({ type: 'error', message: 'Không tìm thấy chủ điểm ngữ pháp cần sửa.' });
      return;
    }

    setEditingId(found.id);
    setForm(toFormState(found));
  }, [grammar, selectedIdFromQuery]);

  const setQueryId = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (id) {
      params.set('id', id);
    } else {
      params.delete('id');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const resetFormForNew = () => {
    setEditingId(null);
    setForm(initialFormState);
    setStatus(null);
    setQueryId(null);
  };

  const onFieldChange = (field: keyof GrammarFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    return {
      title: form.title.trim(),
      grammarType: form.grammarType.trim() || null,
      level: form.level.trim() || null,
      explanation: form.explanation.trim(),
      usageGuide: form.usageGuide.trim() || null,
      structurePattern: form.structurePattern.trim() || null,
      exampleSentence: form.exampleSentence.trim() || null,
      storyExample: form.storyExample.trim() || null,
      practiceHint: form.practiceHint.trim() || null,
      tags: parseTags(form.tagsText),
    };
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để lưu dữ liệu ngữ pháp.' });
      return;
    }

    if (!form.title.trim()) {
      setStatus({ type: 'error', message: 'Tên điểm ngữ pháp không được để trống.' });
      return;
    }

    if (!form.explanation.trim()) {
      setStatus({ type: 'error', message: 'Bạn cần nhập phần giải thích ngữ pháp.' });
      return;
    }

    try {
      setSubmitting(true);
      setStatus(null);

      const endpoint = editingId ? `/api/grammar/${editingId}` : '/api/grammar';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload()),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Không thể lưu chủ điểm ngữ pháp.');
      }

      const savedItem = mapItemFromApi(payload);

      if (editingId) {
        setGrammar((prev) => prev.map((item) => (item.id === editingId ? savedItem : item)));
        setStatus({ type: 'success', message: `Đã cập nhật chủ điểm "${savedItem.title}".` });
      } else {
        setGrammar((prev) => [savedItem, ...prev]);
        setStatus({ type: 'success', message: `Đã thêm chủ điểm "${savedItem.title}".` });
      }

      setEditingId(savedItem.id);
      setForm(toFormState(savedItem));
      setQueryId(savedItem.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteCurrent = async () => {
    if (!editingId) {
      return;
    }

    if (!session?.user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập để xóa dữ liệu ngữ pháp.' });
      return;
    }

    try {
      setDeleting(true);
      setStatus(null);

      const response = await fetch(`/api/grammar/${editingId}`, {
        method: 'DELETE',
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Không thể xóa chủ điểm ngữ pháp.');
      }

      setGrammar((prev) => prev.filter((item) => item.id !== editingId));
      resetFormForNew();
      setStatus({ type: 'success', message: 'Đã xóa chủ điểm ngữ pháp.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
      setStatus({ type: 'error', message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/grammar">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về trang Grammar
          </Link>
        </Button>

        <Button type="button" onClick={resetFormForNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tạo chủ điểm mới
        </Button>
      </div>

      {status ? (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-red-300 bg-red-50 text-red-700'
          }`}
        >
          {status.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          <span>{status.message}</span>
        </div>
      ) : null}

      {!session?.user ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Đăng nhập để thêm, cập nhật và xóa chủ điểm ngữ pháp trong tài khoản của bạn.
          <div className="mt-3">
            <Button asChild variant="outline" className="border-amber-400 bg-white">
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" />
                Đăng nhập ngay
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-white via-white to-primary/5 shadow-lg">
          <CardHeader className="border-b border-primary/10 bg-white/80 backdrop-blur">
            <CardTitle className="text-2xl text-text-main">{editingId ? 'Cập nhật ngữ pháp' : 'Tạo chủ điểm ngữ pháp mới'}</CardTitle>
            <CardDescription>
              Thêm nội dung giải thích, cách dùng, ví dụ và câu chuyện cụ thể để học viên luyện tập trực tiếp.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Tên chủ điểm *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(event) => onFieldChange('title', event.target.value)}
                    placeholder="Ví dụ: Present Perfect"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grammarType">Loại ngữ pháp</Label>
                  <Input
                    id="grammarType"
                    value={form.grammarType}
                    onChange={(event) => onFieldChange('grammarType', event.target.value)}
                    placeholder="Tense, Modal, Clause..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Mức độ</Label>
                  <Input
                    id="level"
                    value={form.level}
                    onChange={(event) => onFieldChange('level', event.target.value)}
                    placeholder="A1-A2, B1-B2..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagsText">Tags (phân tách bằng dấu phẩy)</Label>
                  <Input
                    id="tagsText"
                    value={form.tagsText}
                    onChange={(event) => onFieldChange('tagsText', event.target.value)}
                    placeholder="habit, condition, writing"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Giải thích ngữ pháp *</Label>
                <Textarea
                  id="explanation"
                  rows={4}
                  value={form.explanation}
                  onChange={(event) => onFieldChange('explanation', event.target.value)}
                  placeholder="Mô tả rõ ngữ pháp này dùng khi nào, mục tiêu của cấu trúc là gì..."
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="usageGuide">Cách dùng chi tiết</Label>
                  <Textarea
                    id="usageGuide"
                    rows={4}
                    value={form.usageGuide}
                    onChange={(event) => onFieldChange('usageGuide', event.target.value)}
                    placeholder="Nêu dấu hiệu nhận biết, lỗi thường gặp, mẹo sử dụng..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="structurePattern">Cấu trúc công thức</Label>
                  <Textarea
                    id="structurePattern"
                    rows={4}
                    value={form.structurePattern}
                    onChange={(event) => onFieldChange('structurePattern', event.target.value)}
                    placeholder="S + have/has + V3 ..."
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="exampleSentence">Ví dụ mẫu</Label>
                  <Textarea
                    id="exampleSentence"
                    rows={3}
                    value={form.exampleSentence}
                    onChange={(event) => onFieldChange('exampleSentence', event.target.value)}
                    placeholder="Ví dụ câu tiếng Anh chuẩn ngữ pháp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="practiceHint">Mẹo luyện tập</Label>
                  <Textarea
                    id="practiceHint"
                    rows={3}
                    value={form.practiceHint}
                    onChange={(event) => onFieldChange('practiceHint', event.target.value)}
                    placeholder="Hướng dẫn học viên luyện tập hiệu quả"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storyExample">Câu chuyện/ngữ cảnh cụ thể</Label>
                <Textarea
                  id="storyExample"
                  rows={4}
                  value={form.storyExample}
                  onChange={(event) => onFieldChange('storyExample', event.target.value)}
                  placeholder="Viết một ngữ cảnh cụ thể để người học nhớ cách dùng"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 md:flex-row">
                <Button
                  type="submit"
                  disabled={submitting || deleting || !session?.user}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-dark py-6 text-base text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : editingId ? (
                    'Cập nhật chủ điểm'
                  ) : (
                    'Lưu chủ điểm mới'
                  )}
                </Button>

                {editingId ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={submitting || deleting || !session?.user}
                    onClick={onDeleteCurrent}
                    className="w-full rounded-xl py-6 text-base md:w-auto"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xóa...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa chủ điểm
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Danh sách để sửa nhanh</CardTitle>
            <CardDescription>Chọn chủ điểm đã có để nạp vào form và cập nhật.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={manageSearch}
                onChange={(event) => setManageSearch(event.target.value)}
                className="pl-9"
                placeholder="Tìm chủ điểm..."
              />
            </div>

            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {visibleGrammar.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setQueryId(item.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedItem?.id === item.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary/40'
                  }`}
                >
                  <p className="font-semibold text-text-main">{item.title}</p>
                  <p className="text-xs text-text-muted">{item.grammarType || 'General'}{item.level ? ` • ${item.level}` : ''}</p>
                </button>
              ))}

              {visibleGrammar.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-text-muted">Không tìm thấy chủ điểm phù hợp.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
