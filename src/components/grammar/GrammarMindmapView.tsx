'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitBranchPlus,
  Loader2,
  Search,
  Target,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChipFilter } from '@/components/ui/ChipFilter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { GrammarItem } from './types';
import { GrammarFormulaTable } from './GrammarFormulaTable';

type GrammarMindmapViewProps = {
  items: GrammarItem[];
};

type LevelFocus = 'all' | 'basic' | 'intermediate' | 'advanced';
type LevelBucket = Exclude<LevelFocus, 'all'>;

type StudyProgressItem = {
  grammarEntryId: string;
  isCompleted: boolean;
  completedAt: string | null;
};

const levelFocusOptions: { label: string; value: LevelFocus }[] = [
  { label: 'Tất cả level', value: 'all' },
  { label: 'Cơ bản (A1-A2)', value: 'basic' },
  { label: 'Trung cấp (B1-B2)', value: 'intermediate' },
  { label: 'Nâng cao (C1-C2)', value: 'advanced' },
];

const studyPathOrder: LevelBucket[] = ['basic', 'intermediate', 'advanced'];

function pickQuickFormula(item: GrammarItem): string {
  const first = item.structurePattern?.split('|')?.[0]?.trim();
  return first || 'Chưa có công thức';
}

function getLevelRank(level?: string | null): number {
  const normalized = (level || '').toUpperCase();
  const match = normalized.match(/([ABC])\s*([12])/);

  if (!match) {
    return 99;
  }

  const key = `${match[1]}${match[2]}`;

  if (key === 'A1') return 1;
  if (key === 'A2') return 2;
  if (key === 'B1') return 3;
  if (key === 'B2') return 4;
  if (key === 'C1') return 5;
  if (key === 'C2') return 6;

  return 99;
}

function getLevelBucket(level?: string | null): LevelBucket {
  const rank = getLevelRank(level);

  if (rank <= 2) {
    return 'basic';
  }

  if (rank <= 4) {
    return 'intermediate';
  }

  return 'advanced';
}

function getLevelLabel(level: LevelBucket): string {
  if (level === 'basic') {
    return 'Cơ bản';
  }

  if (level === 'intermediate') {
    return 'Trung cấp';
  }

  return 'Nâng cao';
}

function getFocusLabel(level: LevelFocus): string {
  if (level === 'all') {
    return 'Tất cả';
  }

  return getLevelLabel(level);
}

function getHighlightSentence(text: string): string {
  const cleaned = text.trim();

  if (!cleaned) {
    return '';
  }

  const split = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  return split[0] || cleaned;
}

function formatCompletedAt(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('vi-VN');
}

export function GrammarMindmapView({ items }: GrammarMindmapViewProps) {
  const { data: session } = useSession();
  const canPersistProgress = Boolean(session?.user?.id);

  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('Tất cả');
  const [levelFocus, setLevelFocus] = useState<LevelFocus>('all');

  const [zoomValue, setZoomValue] = useState<number[]>([100]);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null);

  const [collapsedBranches, setCollapsedBranches] = useState<string[]>([]);
  const [selectedGrammarId, setSelectedGrammarId] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [progressByGrammarId, setProgressByGrammarId] = useState<Record<string, StudyProgressItem>>({});
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSavingId, setProgressSavingId] = useState<string | null>(null);

  const grammarTypes = useMemo(() => {
    const values = Array.from(new Set(items.map((item) => item.grammarType?.trim()).filter(Boolean))) as string[];
    return ['Tất cả', ...values.sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType =
        activeType === 'Tất cả' || (item.grammarType || '').toLowerCase() === activeType.toLowerCase();

      if (!matchesType) {
        return false;
      }

      if (levelFocus !== 'all' && getLevelBucket(item.level) !== levelFocus) {
        return false;
      }

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
        item.exampleSentence,
        item.storyExample,
        item.tags.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return blob.includes(q);
    });
  }, [activeType, items, levelFocus, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, GrammarItem[]>();

    for (const item of filteredItems) {
      const key = item.grammarType || 'General';
      const current = map.get(key) || [];
      current.push(item);
      map.set(key, current);
    }

    return Array.from(map.entries())
      .map(([type, list]) => ({
        type,
        list: list.sort((a, b) => {
          const levelDiff = getLevelRank(a.level) - getLevelRank(b.level);

          if (levelDiff !== 0) {
            return levelDiff;
          }

          return a.title.localeCompare(b.title);
        }),
      }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [filteredItems]);

  useEffect(() => {
    if (!selectedGrammarId) {
      return;
    }

    const stillVisible = filteredItems.some((item) => item.id === selectedGrammarId);

    if (!stillVisible) {
      setSelectedGrammarId(null);
    }
  }, [filteredItems, selectedGrammarId]);

  const selectedGrammar = useMemo(() => {
    if (!selectedGrammarId) {
      return null;
    }

    return filteredItems.find((item) => item.id === selectedGrammarId) || null;
  }, [filteredItems, selectedGrammarId]);

  const zoom = zoomValue[0] || 100;

  const collapseAllBranches = () => {
    setCollapsedBranches(grouped.map((group) => group.type));
  };

  const expandAllBranches = () => {
    setCollapsedBranches([]);
  };

  const toggleBranch = (type: string) => {
    setCollapsedBranches((prev) =>
      prev.includes(type) ? prev.filter((value) => value !== type) : [...prev, type]
    );
  };

  const zoomOut = () => {
    setZoomValue((prev) => [Math.max(70, (prev[0] || 100) - 10)]);
  };

  const zoomIn = () => {
    setZoomValue((prev) => [Math.min(170, (prev[0] || 100) + 10)]);
  };

  const resetCanvasView = () => {
    setZoomValue([100]);
    setPanOffset({ x: 0, y: 0 });
  };

  const onCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest('button, input, textarea, a')) {
      return;
    }

    dragOriginRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: panOffset.x,
      offsetY: panOffset.y,
    };

    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!dragOriginRef.current) {
        return;
      }

      const deltaX = event.clientX - dragOriginRef.current.pointerX;
      const deltaY = event.clientY - dragOriginRef.current.pointerY;

      setPanOffset({
        x: dragOriginRef.current.offsetX + deltaX,
        y: dragOriginRef.current.offsetY + deltaY,
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      dragOriginRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      if (!canPersistProgress) {
        if (isMounted) {
          setProgressByGrammarId({});
        }
        return;
      }

      try {
        setProgressLoading(true);

        const response = await fetch('/api/grammar/study-path', {
          method: 'GET',
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'Không thể tải tiến độ Study Path.');
        }

        const nextMap: Record<string, StudyProgressItem> = {};

        const rows = Array.isArray(payload?.items) ? payload.items : [];

        for (const row of rows) {
          if (!row?.grammarEntryId || typeof row.grammarEntryId !== 'string') {
            continue;
          }

          nextMap[row.grammarEntryId] = {
            grammarEntryId: row.grammarEntryId,
            isCompleted: Boolean(row.isCompleted),
            completedAt: row.completedAt || null,
          };
        }

        if (isMounted) {
          setProgressByGrammarId(nextMap);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tải tiến độ học.';

        if (isMounted) {
          setStatusMessage({ type: 'error', text: message });
        }
      } finally {
        if (isMounted) {
          setProgressLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [canPersistProgress]);

  const saveProgress = async (grammarEntryId: string, isCompleted: boolean) => {
    if (!canPersistProgress) {
      setStatusMessage({ type: 'error', text: 'Vui lòng đăng nhập để lưu tiến độ Study Path.' });
      return;
    }

    const previous = progressByGrammarId[grammarEntryId];

    setProgressByGrammarId((prev) => ({
      ...prev,
      [grammarEntryId]: {
        grammarEntryId,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
      },
    }));

    try {
      setProgressSavingId(grammarEntryId);

      const response = await fetch('/api/grammar/study-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grammarEntryId,
          isCompleted,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Không thể lưu tiến độ học.');
      }

      const item = payload?.item as StudyProgressItem;

      setProgressByGrammarId((prev) => ({
        ...prev,
        [grammarEntryId]: {
          grammarEntryId,
          isCompleted: Boolean(item?.isCompleted),
          completedAt: item?.completedAt || null,
        },
      }));

      setStatusMessage({
        type: 'success',
        text: isCompleted ? 'Đã đánh dấu hoàn thành chủ điểm này.' : 'Đã bỏ đánh dấu hoàn thành.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu tiến độ học.';

      setProgressByGrammarId((prev) => {
        if (!previous) {
          const { [grammarEntryId]: _, ...rest } = prev;
          return rest;
        }

        return {
          ...prev,
          [grammarEntryId]: previous,
        };
      });

      setStatusMessage({ type: 'error', text: message });
    } finally {
      setProgressSavingId(null);
    }
  };

  const studyPathItems = useMemo(() => {
    return [...filteredItems]
      .sort((a, b) => {
        const levelDiff = getLevelRank(a.level) - getLevelRank(b.level);

        if (levelDiff !== 0) {
          return levelDiff;
        }

        const typeDiff = (a.grammarType || 'General').localeCompare(b.grammarType || 'General');

        if (typeDiff !== 0) {
          return typeDiff;
        }

        return a.title.localeCompare(b.title);
      })
      .map((item, index) => ({
        step: index + 1,
        bucket: getLevelBucket(item.level),
        item,
      }));
  }, [filteredItems]);

  const completedStudyPathCount = useMemo(
    () => studyPathItems.filter((entry) => progressByGrammarId[entry.item.id]?.isCompleted).length,
    [progressByGrammarId, studyPathItems]
  );

  const completionPercent =
    studyPathItems.length > 0 ? Math.round((completedStudyPathCount / studyPathItems.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-5 w-5 text-primary" />
            Grammar Mindmap Interactive
          </CardTitle>
          <CardDescription>
            Mindmap dạng workflow có node hình chữ nhật, line nối giữa các node, zoom, kéo thả canvas và thu/phóng nhánh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Tìm nhanh chủ điểm trong mindmap..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-medium text-text-muted">Nhóm ngữ pháp:</span>
            {grammarTypes.map((type) => (
              <ChipFilter key={type} label={type} isActive={activeType === type} onClick={() => setActiveType(type)} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-medium text-text-muted">Focus theo level:</span>
            {levelFocusOptions.map((option) => (
              <ChipFilter
                key={option.value}
                label={option.label}
                isActive={levelFocus === option.value}
                onClick={() => setLevelFocus(option.value)}
              />
            ))}
          </div>

          <div className="grid gap-3 rounded-xl border border-primary/20 bg-white p-4 md:grid-cols-[minmax(0,1fr)_420px] md:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={collapseAllBranches}>
                Thu tất cả nhánh
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={expandAllBranches}>
                Mở tất cả nhánh
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={resetCanvasView}>
                Reset canvas
              </Button>
              <span className="text-xs text-text-muted">
                Focus: {getFocusLabel(levelFocus)} • {filteredItems.length} node
              </span>
            </div>

            <div className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:items-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Zoom</span>
              <Slider value={zoomValue} min={70} max={170} step={5} onValueChange={setZoomValue} />
              <Button type="button" size="icon" variant="outline" onClick={zoomOut} aria-label="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={zoomIn} aria-label="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            className={`relative h-[680px] overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-white via-white to-primary/5 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={onCanvasMouseDown}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,143,177,0.12),transparent_45%)]" />

            <div
              className="absolute left-0 top-0 origin-top-left transition-transform duration-150"
              style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})` }}
            >
              <div className="w-[1320px] p-6">
                <div className="flex justify-center">
                  <div className="rounded-xl border border-primary/50 bg-primary/10 px-6 py-3 text-center shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Root Node</p>
                    <p className="text-lg font-bold text-text-main">English Grammar Workflow</p>
                    <p className="text-xs text-text-muted">{filteredItems.length} node • zoom {zoom}%</p>
                  </div>
                </div>

                <div className="mt-2 flex justify-center">
                  <div className="h-8 w-px bg-primary/35" />
                </div>

                <div className="relative mt-2">
                  <div className="absolute left-8 right-8 top-0 h-px bg-primary/30" />

                  <div className="grid grid-cols-1 gap-5 pt-5 md:grid-cols-2 xl:grid-cols-3">
                    {grouped.map((group) => {
                      const isCollapsed = collapsedBranches.includes(group.type);

                      return (
                        <div key={group.type} className="relative rounded-2xl border border-primary/25 bg-white p-4 shadow-sm">
                          <div className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-primary/30" />

                          <div className="rounded-xl border border-primary/25 bg-secondary/35 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-text-main">
                                  <GitBranchPlus className="mr-1 inline h-4 w-4 text-primary" />
                                  {group.type}
                                </p>
                                <p className="text-xs text-text-muted">{group.list.length} node</p>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => toggleBranch(group.type)}
                                className="h-8 px-2"
                              >
                                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          {!isCollapsed ? (
                            <div className="relative mt-3 space-y-2 pl-4">
                              <div className="absolute left-1.5 top-0 bottom-2 w-px bg-primary/25" />

                              {group.list.map((item) => {
                                const isActive = selectedGrammar?.id === item.id;
                                const isCompleted = Boolean(progressByGrammarId[item.id]?.isCompleted);

                                return (
                                  <div key={item.id} className="relative">
                                    <span className="absolute -left-4 top-5 h-px w-4 bg-primary/25" />
                                    <button
                                      type="button"
                                      onClick={() => setSelectedGrammarId(item.id)}
                                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                        isActive
                                          ? 'border-primary bg-primary/10'
                                          : 'border-border bg-white hover:border-primary/40 hover:bg-primary/5'
                                      }`}
                                    >
                                      <p className="text-sm font-semibold text-text-main">{item.title}</p>
                                      <p className="mt-1 text-xs text-text-muted line-clamp-2">{pickQuickFormula(item)}</p>
                                      <div className="mt-1 flex items-center justify-between">
                                        <p className="text-[11px] font-medium text-primary-dark">
                                          {item.level || 'Chưa gán level'} • {getLevelLabel(getLevelBucket(item.level))}
                                        </p>
                                        {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : null}
                                      </div>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs text-text-muted">
                              Nhánh đang thu gọn. Bấm để mở lại.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {statusMessage ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            statusMessage.type === 'success'
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-red-300 bg-red-50 text-red-700'
          }`}
        >
          {statusMessage.text}
        </div>
      ) : null}

      {selectedGrammar ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl">Chi tiết node: {selectedGrammar.title}</CardTitle>
            <CardDescription>
              {selectedGrammar.grammarType || 'General'}{selectedGrammar.level ? ` • ${selectedGrammar.level}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-text-muted">
            <div className="rounded-xl border border-primary/20 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Giải thích trọng tâm</p>
              <p className="mt-2">{selectedGrammar.explanation}</p>
            </div>

            <GrammarFormulaTable structurePattern={selectedGrammar.structurePattern} />

            {selectedGrammar.usageGuide ? (
              <div className="rounded-xl border border-primary/20 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Cách dùng</p>
                <p className="mt-2">{selectedGrammar.usageGuide}</p>
              </div>
            ) : null}

            {selectedGrammar.storyExample ? (
              <div className="rounded-xl border border-primary/20 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Ngữ cảnh câu chuyện</p>
                <p className="mt-2">{selectedGrammar.storyExample}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/20">
          <CardContent className="py-10 text-center text-sm text-text-muted">
            <Target className="mx-auto mb-3 h-5 w-5 text-primary" />
            Chưa chọn node nào. Hãy click vào node hình chữ nhật trong mindmap để mở chi tiết.
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">Study Path Tự Động</CardTitle>
          <CardDescription>
            Lộ trình học tự sắp xếp từ cơ bản đến nâng cao. Bạn có thể đánh dấu đã học/chưa học để theo dõi tiến độ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-muted">
                Tiến độ: {completedStudyPathCount}/{studyPathItems.length} bước ({completionPercent}%)
              </p>
              <p className="text-xs text-text-muted">
                {progressLoading ? 'Đang tải tiến độ...' : canPersistProgress ? 'Đã đồng bộ theo tài khoản' : 'Đăng nhập để lưu tiến độ'}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary/60">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>

          {studyPathItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-text-muted">
              Không có chủ điểm phù hợp để tạo study path với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {studyPathOrder.map((phase) => {
                const phaseItems = studyPathItems.filter((entry) => entry.bucket === phase);

                return (
                  <div key={phase} className="rounded-xl border border-primary/20 bg-white p-4">
                    <p className="text-sm font-semibold text-primary-dark">Giai đoạn: {getLevelLabel(phase)}</p>
                    <p className="text-xs text-text-muted">{phaseItems.length} chủ điểm</p>

                    {phaseItems.length === 0 ? (
                      <p className="mt-3 text-xs text-text-muted">Không có mục nào trong giai đoạn này.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {phaseItems.map((entry) => {
                          const isCompleted = Boolean(progressByGrammarId[entry.item.id]?.isCompleted);
                          const completedAt = formatCompletedAt(progressByGrammarId[entry.item.id]?.completedAt || null);
                          const isSaving = progressSavingId === entry.item.id;

                          return (
                            <div
                              key={entry.item.id}
                              className={`rounded-lg border px-3 py-2 transition-colors ${
                                isCompleted
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-border bg-secondary/20 hover:border-primary/40 hover:bg-primary/5'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedGrammarId(entry.item.id)}
                                className="w-full text-left"
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Bước {entry.step}</p>
                                <p className="text-sm font-semibold text-text-main">{entry.item.title}</p>
                                <p className="mt-1 text-xs text-text-muted line-clamp-2">
                                  {getHighlightSentence(entry.item.explanation)}
                                </p>
                              </button>

                              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[11px] text-text-muted">
                                  {isCompleted && completedAt ? `Hoàn thành: ${completedAt}` : 'Chưa hoàn thành'}
                                </p>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isCompleted ? 'outline' : 'default'}
                                  disabled={!canPersistProgress || isSaving}
                                  onClick={() => saveProgress(entry.item.id, !isCompleted)}
                                  className="h-7 px-2 text-xs"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                      Đang lưu
                                    </>
                                  ) : isCompleted ? (
                                    'Đánh dấu chưa học'
                                  ) : (
                                    'Đánh dấu đã học'
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
