'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Calendar,
  Clock,
  FileText,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  Edit3,
  Send,
  AlertTriangle,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type GeneratedTask = {
  title: string;
  description: string;
  knowledgeArea: string;
  estimatedMinutes: number;
  priority: string;
  resources: { type: string; title: string; url?: string }[];
};

type GeneratedDailyPlan = {
  date: string;
  summary: string;
  tasks: GeneratedTask[];
};

type GeneratedPlan = {
  title: string;
  description: string;
  subTopics: string[];
  dailyPlans: GeneratedDailyPlan[];
};

const STEP_LABELS = [
  { label: 'Chủ đề', icon: BookOpen },
  { label: 'Lịch trình', icon: Calendar },
  { label: 'Mô tả', icon: FileText },
  { label: 'Xem trước', icon: Check },
];

const POPULAR_TOPICS = [
  'Java Spring Boot', 'Python', 'React / Next.js', 'Deep Learning',
  'SQL & Database', 'System Design', 'Docker & Kubernetes', 'Git & DevOps',
  'Data Structures & Algorithms', 'TypeScript', 'AWS Cloud', 'IELTS Speaking',
  'Machine Learning', 'Microservices', 'REST API Design', 'CI/CD Pipeline',
];

export default function NewPlanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Form data
  const [topic, setTopic] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [timeSlotStart, setTimeSlotStart] = useState('09:00');
  const [timeSlotEnd, setTimeSlotEnd] = useState('12:00');
  const [numberOfDays, setNumberOfDays] = useState(7);
  const [description, setDescription] = useState('');

  // Generated plan
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);

  const canProceed = () => {
    if (step === 0) return topic.trim().length > 0;
    if (step === 1) return startDate && timeSlotStart && timeSlotEnd && numberOfDays > 0;
    if (step === 2) return true;
    return false;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deep-workspace/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          description: description || topic,
          startDate,
          timeSlotStart,
          timeSlotEnd,
          numberOfDays,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi tạo kế hoạch');
      }

      const data = await res.json();
      setSavedPlanId(data.id);
      setGeneratedPlan({
        title: data.title,
        description: data.description || '',
        subTopics: data.subTopics || [],
        dailyPlans: data.dailyPlans.map((dp: { date: string; aiSuggestion?: { summary?: string }; tasks: GeneratedTask[] }) => ({
          date: dp.date,
          summary: dp.aiSuggestion?.summary || '',
          tasks: dp.tasks,
        })),
      });
      setStep(3);
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể tạo kế hoạch. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editMessage.trim() || !savedPlanId) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/deep-workspace/plans/${savedPlanId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editMessage }),
      });

      if (!res.ok) throw new Error('Chỉnh sửa thất bại');

      const data = await res.json();
      setGeneratedPlan({
        title: data.title,
        description: data.description || '',
        subTopics: data.subTopics || [],
        dailyPlans: data.dailyPlans.map((dp: { date: string; aiSuggestion?: { summary?: string }; tasks: GeneratedTask[] }) => ({
          date: dp.date,
          summary: dp.aiSuggestion?.summary || '',
          tasks: dp.tasks,
        })),
      });
      setEditMessage('');
      setEditMode(false);
      toast({
        title: 'Đã cập nhật',
        description: 'Kế hoạch đã được AI chỉnh sửa theo yêu cầu. Xem lại trước khi duyệt.',
      });
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể chỉnh sửa',
        variant: 'destructive',
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!savedPlanId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/deep-workspace/plans/${savedPlanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (!res.ok) throw new Error('Approve thất bại');

      toast({
        title: '✅ Đã duyệt kế hoạch',
        description: 'Kế hoạch đã được duyệt và sẵn sàng thực hiện!',
      });
      router.push('/workspace');
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể duyệt kế hoạch', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 2) {
      void handleGenerate();
    } else {
      setStep(s => Math.min(s + 1, 3));
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/workspace"
        className="inline-flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 tracking-widest uppercase border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 rounded transition-all duration-150"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> [ BACK_TO_COMMAND_HUB ]
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 bg-slate-900/20 p-5 rounded-xl backdrop-blur relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-500/30" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-500/30" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-500/30" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-500/30" />

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            <Sparkles className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">PLAN_GENERATOR</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
              AI Roadmap Engine • Thiết lập chương trình học tập cá nhân hóa
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {STEP_LABELS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <div className={cn(
              'flex items-center gap-2 rounded px-2.5 py-1 text-[10px] font-mono transition-all border',
              i === step
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-sm'
                : i < step
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
            )}>
              {i < step ? <Check className="h-3 w-3 text-emerald-400" /> : <s.icon className="h-3 w-3" />}
              <span className="uppercase tracking-widest">{s.label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <ChevronRight className={cn(
                'h-3.5 w-3.5 flex-shrink-0',
                i < step ? 'text-emerald-400' : 'text-slate-700'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur shadow-sm p-6 relative">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-500/30" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-500/30" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-500/30" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-500/30" />

        {/* Step 0: Topic */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-2 text-slate-300">Chủ đề học tập</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="VD: Java Spring Boot, Deep Learning, IELTS speaking..."
                className="w-full rounded-lg border border-slate-800 px-4 py-3 text-xs font-mono focus:outline-none focus:border-cyan-500/50 bg-slate-950/60 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-3">Hoặc chọn chủ đề phổ biến</label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TOPICS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={cn(
                      'rounded px-2.5 py-1 text-[10px] font-mono border transition-all uppercase',
                      topic === t
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : 'bg-slate-900/20 text-slate-400 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Schedule */}
        {step === 1 && (
          <div className="space-y-5 font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">
                  <Calendar className="h-3.5 w-3.5 inline mr-1.5 text-cyan-400" />
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500/50 bg-slate-950/60 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">Số ngày kéo dài</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={numberOfDays}
                  onChange={e => setNumberOfDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500/50 bg-slate-950/60 text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">
                  <Clock className="h-3.5 w-3.5 inline mr-1.5 text-cyan-400" />
                  Bắt đầu lúc
                </label>
                <input
                  type="time"
                  value={timeSlotStart}
                  onChange={e => setTimeSlotStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500/50 bg-slate-950/60 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">
                  <Clock className="h-3.5 w-3.5 inline mr-1.5 text-cyan-400" />
                  Kết thúc lúc
                </label>
                <input
                  type="time"
                  value={timeSlotEnd}
                  onChange={e => setTimeSlotEnd(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500/50 bg-slate-950/60 text-slate-200"
                />
              </div>
            </div>

            <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-3 text-[10px] text-cyan-400 flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-cyan-400 animate-pulse" />
              <span>AI will allocate suitable study payloads inside the time slot {timeSlotStart} - {timeSlotEnd} daily ({numberOfDays} days)</span>
            </div>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div className="space-y-4 font-mono">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">Mô tả yêu cầu chi tiết</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={`VD: Tôi muốn học ${topic} từ cơ bản đến nâng cao. Tập trung hơn vào thực hành...`}
                rows={6}
                className="w-full rounded-lg border border-slate-800 px-4 py-3 text-xs focus:outline-none focus:border-cyan-500/50 bg-slate-950/60 text-slate-200 resize-none"
              />
            </div>

            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 text-[10px] text-amber-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-400" />
              <span>AI generates more aligned roadmaps when provided with detailed expectations. Can leave empty for default roadmap.</span>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Approve */}
        {step === 3 && generatedPlan && (
          <div className="space-y-5 font-mono">
            {/* Plan Overview */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">{generatedPlan.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{generatedPlan.description}</p>
                </div>
                <div className="flex items-center gap-1.5 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  WAITING_APPROVAL
                </div>
              </div>

              {generatedPlan.subTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {generatedPlan.subTopics.map((st, i) => (
                    <span key={i} className="rounded bg-cyan-500/10 px-2 py-0.5 text-[9px] text-cyan-400 border border-cyan-500/20">
                      {st}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Plans */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs flex items-center gap-2 text-slate-200 uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-cyan-400" />
                DAILY_PAYLOAD_MAP ({generatedPlan.dailyPlans.length} days)
              </h4>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {generatedPlan.dailyPlans.map((dp, dayIdx) => (
                  <details key={dayIdx} className="group rounded-lg border border-slate-800 overflow-hidden bg-slate-950/40" open={dayIdx === 0}>
                    <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-900/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                          {dayIdx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {new Date(dp.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <p className="text-[9px] text-slate-500">{dp.tasks.length} tasks</p>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-open:rotate-90 transition-transform" />
                    </summary>

                    <div className="p-3 pt-0 space-y-2">
                      {dp.tasks.map((task, taskIdx) => (
                        <div key={taskIdx} className="rounded bg-slate-900/40 border border-slate-900/60 p-3 text-xs space-y-1.5">
                          <div className="flex items-start justify-between">
                            <h5 className="font-bold text-xs text-slate-200">{task.title}</h5>
                            <span className={cn(
                              'text-[8px] font-bold px-1.5 py-0.5 rounded',
                              task.priority === 'HIGH' || task.priority === 'CRITICAL'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : task.priority === 'MEDIUM'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-slate-800 text-slate-400'
                            )}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[10px] text-slate-400">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[9px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-cyan-400" />
                              {task.knowledgeArea}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-cyan-400" />
                              {task.estimatedMinutes}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* Edit Mode */}
            {editMode && (
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <Edit3 className="h-4 w-4" />
                  RECALIBRATE_REQUEST (AI_PROMPT_REWRITE)
                </div>
                <textarea
                  value={editMessage}
                  onChange={e => setEditMessage(e.target.value)}
                  placeholder="VD: Thêm bài tập thực hành, giảm thời gian lý thuyết..."
                  rows={3}
                  className="w-full rounded border border-slate-800 px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/50 bg-slate-950 text-slate-200 resize-none font-mono"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={editLoading || !editMessage.trim()}
                    className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-[10px] font-bold py-1 h-auto"
                  >
                    {editLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3 w-3 mr-1.5" />}
                    SEND_AI_SHIELD
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditMode(false); setEditMessage(''); }}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                  className="text-[10px] font-mono border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 h-8"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  {editMode ? 'Đóng chỉnh sửa' : 'Chỉnh sửa'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-300 h-8"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5 mr-1', loading ? 'animate-spin' : '')} />
                  Tạo lại
                </Button>
              </div>

              <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-[10px] font-bold font-mono px-4 h-8 border-none"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                APPROVE_ROADMAP
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {step < 3 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="text-[10px] font-mono text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            BACK
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canProceed() || loading}
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-mono text-[10px] font-bold px-4 h-8 border-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                CONNECTING ROADMAP...
              </>
            ) : step === 2 ? (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                EXECUTE AI BUILD
              </>
            ) : (
              <>
                NEXT_NODE
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
