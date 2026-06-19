'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  Loader2,
  PlayCircle,
  Send,
  Sparkles,
  Star,
  Trash2,
  BookOpen,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { planStatusLabels, planStatusColors, type DeepPlanStatusType } from '@/lib/deep-workspace';

type TaskData = {
  id: string;
  title: string;
  description: string | null;
  knowledgeArea: string;
  estimatedMinutes: number;
  actualMinutes: number | null;
  status: string;
  priority: string;
  order: number;
};

type DailyPlanData = {
  id: string;
  date: string;
  status: string;
  completionRate: number;
  selfRating: number | null;
  reflection: string | null;
  timeSlotStart: string;
  timeSlotEnd: string;
  tasks: TaskData[];
};

type PlanData = {
  id: string;
  title: string;
  description: string | null;
  topic: string;
  subTopics: string[];
  status: DeepPlanStatusType;
  startDate: string;
  endDate: string | null;
  dailyPlans: DailyPlanData[];
};

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [ratingDay, setRatingDay] = useState<string | null>(null);
  const [selfRating, setSelfRating] = useState(3);

  const planId = params.planId as string;

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/deep-workspace/plans/${planId}`);
      if (res.ok) {
        setPlan(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      await fetch(`/api/deep-workspace/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchPlan();
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái nhiệm vụ', variant: 'destructive' });
    }
  };

  const startTask = async (taskId: string) => {
    try {
      await fetch(`/api/deep-workspace/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      fetchPlan();
      toast({
        title: 'Bắt đầu nhiệm vụ',
        description: 'Nhiệm vụ đã được chuyển sang Đang thực hiện. Bạn có thể chọn nó trên đồng hồ Pomodoro ở thanh bên!',
      });
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' });
    }
  };

  const handleEdit = async () => {
    if (!editMessage.trim()) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/deep-workspace/plans/${planId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editMessage }),
      });
      if (!res.ok) throw new Error('Edit failed');
      const data = await res.json();
      setPlan(data);
      setEditMessage('');
      setEditMode(false);
      toast({ title: 'Đã cập nhật', description: 'Kế hoạch đã được AI chỉnh sửa.' });
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await fetch(`/api/deep-workspace/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      fetchPlan();
      toast({ title: '✅ Đã duyệt kế hoạch!' });
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa kế hoạch này?')) return;
    try {
      await fetch(`/api/deep-workspace/plans/${planId}`, { method: 'DELETE' });
      router.push('/workspace');
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không tìm thấy kế hoạch</p>
        <Link href="/workspace">
          <Button variant="outline" className="mt-4 border-pink-100 text-pink-600 hover:bg-pink-50/50">Quay lại</Button>
        </Link>
      </div>
    );
  }

  const totalTasks = plan.dailyPlans.reduce((s, d) => s + d.tasks.length, 0);
  const completedTasks = plan.dailyPlans.reduce(
    (s, d) => s + d.tasks.filter(t => t.status === 'COMPLETED').length, 0
  );
  const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Print styles style element */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, aside, nav, button, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .max-w-4xl {
            max-width: 100% !important;
          }
          details {
            display: block !important;
          }
          details > summary {
            pointer-events: none !important;
          }
          details > summary::-webkit-details-marker {
            display: none !important;
          }
          details > summary svg {
            display: none !important;
          }
        }
      `}</style>

      {/* Back Button + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/workspace" className="print:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-1 hover:bg-pink-50 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full border',
                planStatusColors[plan.status]
              )}>
                {planStatusLabels[plan.status]}
              </span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                {plan.topic}
              </span>
            </div>
            <h1 className="text-xl font-bold text-text-main">{plan.title}</h1>
            {plan.description && (
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          {plan.status === 'DRAFT' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)} className="text-xs border-pink-200 text-pink-700 hover:bg-pink-50/50">
                <Edit3 className="h-3 w-3 mr-1" /> Chỉnh sửa
              </Button>
              <Button size="sm" onClick={handleApprove}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs border-none hover:from-emerald-600 hover:to-teal-600 shadow-sm">
                ✓ Duyệt
              </Button>
            </>
          )}

          {/* Export PDF Button */}
          {plan.status !== 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs border-pink-200 text-pink-700 hover:bg-pink-50/50"
            >
              <Printer className="h-3.5 w-3.5 mr-1" /> Xuất PDF
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="rounded-xl bg-gradient-to-r from-pink-50/40 to-pink-100/20 border border-pink-100/60 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-main">Tiến độ tổng thể</span>
          <span className="text-sm font-bold text-pink-600">{overallCompletion}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-300 transition-all duration-700"
            style={{ width: `${overallCompletion}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>{completedTasks}/{totalTasks} nhiệm vụ hoàn thành</span>
          <span>{plan.dailyPlans.length} ngày</span>
        </div>
      </div>

      {/* Edit Mode */}
      {editMode && plan.status === 'DRAFT' && (
        <div className="rounded-xl border border-pink-200 bg-pink-50/20 p-4 space-y-3 print:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold text-pink-700">
            <Edit3 className="h-4 w-4 text-pink-500" />
            Chế độ chỉnh sửa
          </div>
          <textarea
            value={editMessage}
            onChange={e => setEditMessage(e.target.value)}
            placeholder="Nhập yêu cầu chỉnh sửa cho AI..."
            rows={3}
            className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none text-text-main bg-white"
          />
          <Button size="sm" onClick={handleEdit} disabled={editLoading || !editMessage.trim()}
            className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs border-none">
            {editLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
            Gửi cho AI
          </Button>
        </div>
      )}

      {/* Daily Plans */}
      <div className="space-y-3">
        {plan.dailyPlans.map((dp, dayIdx) => {
          const dayCompleted = dp.tasks.filter(t => t.status === 'COMPLETED').length;
          const dayTotal = dp.tasks.length;
          const dayRate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

          return (
            <div key={dp.id} className="rounded-xl border border-pink-50 overflow-hidden bg-white/80 shadow-sm">
              {/* Day Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-50/10 to-white border-b border-pink-50/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold border',
                    dayRate === 100
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : dayRate > 0
                        ? 'bg-pink-50 text-pink-600 border-pink-100'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                  )}>
                    {dayIdx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-main">
                      {new Date(dp.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3 text-pink-500" />
                      {dp.timeSlotStart} - {dp.timeSlotEnd}
                      <span className="text-pink-500 font-medium">{dayRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Self Rating */}
                  {plan.status !== 'DRAFT' && (
                    <button
                      onClick={() => setRatingDay(ratingDay === dp.id ? null : dp.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-500 transition-colors print:hidden"
                    >
                      <Star className={cn('h-4 w-4', dp.selfRating ? 'fill-amber-400 text-amber-400' : '')} />
                      {dp.selfRating || '-'}/5
                    </button>
                  )}
                </div>
              </div>

              {/* Rating Input */}
              {ratingDay === dp.id && (
                <div className="px-4 py-2 bg-amber-50/50 border-b border-border/20 flex items-center gap-3 print:hidden">
                  <span className="text-xs text-muted-foreground">Tự đánh giá:</span>
                  {[1, 2, 3, 4, 5].map(r => (
                    <button
                      key={r}
                      onClick={() => setSelfRating(r)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className={cn('h-5 w-5', r <= selfRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks */}
              <div className="divide-y divide-slate-100">
                {dp.tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 px-4 py-3 hover:bg-pink-50/10 transition-colors group bg-white">
                    <button
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                      className="mt-0.5 flex-shrink-0 print:hidden"
                    >
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : task.status === 'IN_PROGRESS' ? (
                        <PlayCircle className="h-5 w-5 text-pink-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium text-text-main',
                        task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''
                      )}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-pink-500" /> {task.knowledgeArea}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-pink-500" /> {task.estimatedMinutes}p
                        </span>
                        {task.actualMinutes && (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <Clock className="h-3 w-3 text-emerald-500" /> Thực tế: {task.actualMinutes}p
                          </span>
                        )}
                        <span className={cn(
                          'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                          task.priority === 'HIGH' || task.priority === 'CRITICAL'
                            ? 'bg-red-50 text-red-500'
                            : task.priority === 'MEDIUM'
                              ? 'bg-blue-50 text-blue-500'
                              : 'bg-slate-50 text-slate-400'
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    {task.status === 'TODO' && plan.status !== 'DRAFT' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-pink-600 hover:text-pink-700 hover:bg-pink-50/50 print:hidden"
                      >
                        <PlayCircle className="h-3.5 w-3.5 mr-1" /> Bắt đầu
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
