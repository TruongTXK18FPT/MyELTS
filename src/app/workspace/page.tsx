'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { CalendarView } from '@/components/workspace/calendar/CalendarView';
import {
  Sparkles,
  Loader2,
  Cpu,
  Target,
  BookOpen,
  Brain,
  Clock,
  TrendingUp,
  Activity,
  Network,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  BookText,
  PenTool,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  NotebookPen,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type PlanWithDailyPlans = {
  id: string;
  title: string;
  topic: string;
  status: string;
  startDate: string;
  endDate: string | null;
  dailyPlans: {
    id: string;
    date: string;
    status: string;
    completionRate: number;
    timeSlotStart: string;
    timeSlotEnd: string;
    tasks: {
      id: string;
      title: string;
      status: string;
      knowledgeArea: string;
      estimatedMinutes: number;
      priority: string;
    }[];
  }[];
};

type DashboardData = {
  plans: { total: number; active: number; completed: number };
  tasks: { total: number; completed: number; inProgress: number; pending: number };
  notes: { total: number };
  streak: number;
  weeklyData: { date: string; completionRate: number }[];
  pendingTasks: {
    id: string;
    title: string;
    status: string;
    knowledgeArea: string;
    date: string;
  }[];
  heatmapData: { date: string; count: number }[];
  knowledgeGraph: {
    nodes: { id: string; group: number; val: number }[];
    links: { source: string; target: string; value: number }[];
  };
  ielts: {
    hasDiagnostic: boolean;
    overallBand: number | null;
    listeningBand: number | null;
    readingBand: number | null;
    writingBand: number | null;
    speakingBand: number | null;
    takenAt: string | null;
    targetBand: number;
    totalAttempts: number;
    totalVocab: number;
    completedGrammar: number;
  };
};

function TechStatCard({
  title,
  value,
  subtext,
  icon: Icon,
  glowColor = 'cyan',
  className,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  glowColor?: 'cyan' | 'pink' | 'purple' | 'emerald' | 'amber' | 'rose';
  className?: string;
}) {
  const glowStyles = {
    cyan: 'border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] text-cyan-400 bg-cyan-500/5',
    pink: 'border-pink-500/20 shadow-[0_0_15px_rgba(244,114,182,0.08)] hover:border-pink-400/40 hover:shadow-[0_0_20px_rgba(244,114,182,0.15)] text-pink-400 bg-pink-500/5',
    purple: 'border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.08)] hover:border-purple-400/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] text-purple-400 bg-purple-500/5',
    emerald: 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.08)] hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] text-emerald-400 bg-emerald-500/5',
    amber: 'border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.08)] hover:border-amber-400/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] text-amber-400 bg-amber-500/5',
    rose: 'border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.08)] hover:border-rose-400/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] text-rose-400 bg-rose-500/5',
  };

  const textStyles = {
    cyan: 'text-cyan-400 border-cyan-500/30',
    pink: 'text-pink-400 border-pink-500/30',
    purple: 'text-purple-400 border-purple-500/30',
    emerald: 'text-emerald-400 border-emerald-500/30',
    amber: 'text-amber-400 border-amber-500/30',
    rose: 'text-rose-400 border-rose-500/30',
  };

  return (
    <div className={cn(
      'rounded-xl border bg-slate-900/40 backdrop-blur p-4 transition-all duration-300 relative group overflow-hidden',
      glowStyles[glowColor],
      className
    )}>
      {/* Decorative corner grid marks */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-current opacity-40" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-current opacity-40" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-current opacity-40" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-current opacity-40" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-100 font-mono">{value}</p>
          {subtext && <p className="text-[10px] text-slate-400 font-mono mt-1">{subtext}</p>}
        </div>
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center border bg-slate-950/60', textStyles[glowColor])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const { data: session } = useSession();
  
  // Dashboard states
  const [dbData, setDbData] = useState<DashboardData | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  
  // Calendar states
  const [plans, setPlans] = useState<PlanWithDailyPlans[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Tab state: 'overview' | 'calendar' | 'modules'
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'modules'>('overview');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Refs for worktree elements
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLButtonElement>(null);
  const chronoPlannerRef = useRef<HTMLButtonElement>(null);
  const planGeneratorRef = useRef<HTMLDivElement>(null);
  const knowledgeVaultRef = useRef<HTMLDivElement>(null);
  const synapseRecallRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    core: { x: number; y: number };
    chronoPlanner: { x: number; y: number };
    planGenerator: { x: number; y: number };
    knowledgeVault: { x: number; y: number };
    synapseRecall: { x: number; y: number };
  }>({
    core: { x: 450, y: 110 },
    chronoPlanner: { x: 220, y: 50 },
    planGenerator: { x: 220, y: 170 },
    knowledgeVault: { x: 680, y: 50 },
    synapseRecall: { x: 680, y: 170 },
  });

  const updateCoordinates = useCallback(() => {
    if (!containerRef.current) return;
    const parentRect = containerRef.current.getBoundingClientRect();

    const getCenter = (el: HTMLElement | null, fallbackX: number, fallbackY: number) => {
      if (!el) return { x: fallbackX, y: fallbackY };
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top + rect.height / 2,
      };
    };

    setCoords({
      core: getCenter(coreRef.current, parentRect.width / 2, parentRect.height / 2),
      chronoPlanner: getCenter(chronoPlannerRef.current, 220, 50),
      planGenerator: getCenter(planGeneratorRef.current, 220, 170),
      knowledgeVault: getCenter(knowledgeVaultRef.current, 680, 50),
      synapseRecall: getCenter(synapseRecallRef.current, 680, 170),
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(updateCoordinates, 300);
    window.addEventListener('resize', updateCoordinates);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCoordinates);
    };
  }, [updateCoordinates, activeTab]);


  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/deep-workspace/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/deep-workspace/dashboard');
      if (res.ok) {
        setDbData(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      void fetchPlans();
      void fetchDashboard();
    }
  }, [session, fetchPlans, fetchDashboard]);

  // Heatmap helper calculation
  const heatmapDays = useMemo(() => {
    if (!dbData) return [];
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date();
    startDate.setDate(today.getDate() - 83); // 12 weeks total

    const activityMap = new Map(dbData.heatmapData.map(h => [h.date, h.count]));

    for (let i = 0; i < 84; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      const count = activityMap.get(dateKey) || 0;

      days.push({
        date: currentDate,
        dateString: dateKey,
        count,
      });
    }

    return days;
  }, [dbData]);

  // Graph coordinate calculation
  const graphLayout = useMemo(() => {
    if (!dbData || !dbData.knowledgeGraph) return { nodes: [], links: [] };

    const { nodes, links } = dbData.knowledgeGraph;
    if (nodes.length <= 1) return { nodes: [], links: [] };

    const centerX = 200;
    const centerY = 120;
    const count = nodes.length - 1;

    const computedNodes = [
      { id: nodes[0].id, x: centerX, y: centerY, val: nodes[0].val, group: nodes[0].group }
    ];

    nodes.slice(1).forEach((node, i) => {
      const angle = (i * 2 * Math.PI) / count;
      const radius = 70 + (i % 2 === 0 ? 0 : 20);
      computedNodes.push({
        id: node.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        val: node.val,
        group: node.group,
      });
    });

    const computedLinks = links.map(link => {
      const sourceNode = computedNodes.find(n => n.id === link.source);
      const targetNode = computedNodes.find(n => n.id === link.target);
      return {
        source: sourceNode || { x: centerX, y: centerY },
        target: targetNode || { x: centerX, y: centerY },
        value: link.value,
      };
    });

    return { nodes: computedNodes, links: computedLinks };
  }, [dbData]);

  if (dbLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            Đang tải không gian học tập...
          </p>
        </div>
      </div>
    );
  }

  const taskCompletionRate = dbData?.tasks.total && dbData.tasks.total > 0
    ? Math.round((dbData.tasks.completed / dbData.tasks.total) * 100)
    : 0;

  return (
    <div className="space-y-6 select-none">
      
      {/* 1. Interactive Vis-Worktree Selector */}
      <div className="border border-slate-800 bg-slate-900/20 rounded-xl p-6 backdrop-blur relative overflow-hidden flex flex-col items-center">
        {/* Futuristic corner telemetry ticks */}
        <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-slate-600">[ SƠ ĐỒ TƯƠNG TÁC ]</div>
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-500/40" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-500/40" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-500/40" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-500/40" />

        <h3 className="text-xs font-bold tracking-widest text-cyan-400 font-mono uppercase mb-6 text-center">
          // BẢNG ĐIỀU HƯỚNG TÍNH NĂNG
        </h3>

        {/* The Graphic Worktree Nodes Grid */}
        <div ref={containerRef} className="relative w-full max-w-4xl min-h-[220px] flex flex-col items-center justify-center">
          {/* SVG Connector Lines in Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0">
            {/* Center to Left Branch */}
            <line x1={coords.core.x} y1={coords.core.y} x2={coords.chronoPlanner.x} y2={coords.chronoPlanner.y} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1={coords.core.x} y1={coords.core.y} x2={coords.planGenerator.x} y2={coords.planGenerator.y} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Center to Right Branch */}
            <line x1={coords.core.x} y1={coords.core.y} x2={coords.knowledgeVault.x} y2={coords.knowledgeVault.y} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1={coords.core.x} y1={coords.core.y} x2={coords.synapseRecall.x} y2={coords.synapseRecall.y} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Center to Center top/bottom */}
            <line x1={coords.core.x} y1={coords.core.y} x2={coords.core.x} y2={coords.core.y - 75} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1={coords.core.x} y1={coords.core.y} x2={coords.core.x} y2={coords.core.y + 75} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>

          {/* Core Central Node */}
          <button
            ref={coreRef}
            onClick={() => setActiveTab('overview')}
            className={cn(
              "absolute z-10 h-16 w-16 rounded-full border flex flex-col items-center justify-center transition-all duration-300",
              activeTab === 'overview'
                ? "bg-cyan-500/25 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-cyan-200"
                : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            )}
            style={{ left: 'calc(50% - 32px)', top: 'calc(50% - 32px)' }}
          >
            <Cpu className="h-6 w-6 animate-pulse" />
            <span className="text-[7px] font-mono tracking-widest mt-1 font-bold">TRUNG TÂM</span>
          </button>

          {/* Left Branch - Planning Cores */}
          <div className="absolute left-[5%] sm:left-[12%] top-[10%] flex flex-col items-end gap-2.5">
            <button
              ref={chronoPlannerRef}
              onClick={() => setActiveTab('calendar')}
              className={cn(
                "px-3 py-2 rounded-lg border text-left font-mono transition-all duration-200 w-44 hover:scale-[1.03]",
                activeTab === 'calendar'
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              )}
            >
              <div className="flex items-center justify-between text-[9px] font-bold text-cyan-500/70">
                <span>BRANCH_A1</span>
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs font-bold mt-1 text-slate-100">KẾ HOẠCH HỌC TẬP</p>
              <span className="text-[7px] text-slate-500">Lịch trình kế hoạch học tập</span>
            </button>

            <Link href="/workspace/plans/new" className="block w-44">
              <div ref={planGeneratorRef} className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 text-left font-mono transition-all hover:border-cyan-500/40 hover:scale-[1.03] group">
                <div className="flex items-center justify-between text-[9px] font-bold text-cyan-500/50 group-hover:text-cyan-400">
                  <span>BRANCH_A2</span>
                  <PlusCircle className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-bold mt-1 text-slate-100 group-hover:text-cyan-400 transition-colors">TẠO LỘ TRÌNH</p>
                <span className="text-[7px] text-slate-500">Thiết lập lộ trình mới</span>
              </div>
            </Link>
          </div>

          {/* Right Branch - Knowledge Vault */}
          <div className="absolute right-[5%] sm:right-[12%] top-[10%] flex flex-col items-start gap-2.5">
            <Link href="/workspace/notes" className="block w-44">
              <div ref={knowledgeVaultRef} className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 text-left font-mono transition-all hover:border-cyan-500/40 hover:scale-[1.03] group">
                <div className="flex items-center justify-between text-[9px] font-bold text-cyan-500/50 group-hover:text-cyan-400">
                  <span>BRANCH_B1</span>
                  <NotebookPen className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-bold mt-1 text-slate-100 group-hover:text-cyan-400 transition-colors">KHO GHI CHÚ</p>
                <span className="text-[7px] text-slate-500">Hệ quản lý ghi chú tri thức</span>
              </div>
            </Link>

            <Link href="/workspace/reviews" className="block w-44">
              <div ref={synapseRecallRef} className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/60 text-left font-mono transition-all hover:border-cyan-500/40 hover:scale-[1.03] group">
                <div className="flex items-center justify-between text-[9px] font-bold text-cyan-500/50 group-hover:text-cyan-400">
                  <span>BRANCH_B2</span>
                  <Brain className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-bold mt-1 text-slate-100 group-hover:text-cyan-400 transition-colors">ÔN TẬP GHI NHỚ</p>
                <span className="text-[7px] text-slate-500">Ôn tập giãn cách Leitner</span>
              </div>
            </Link>
          </div>

          {/* Bottom & Top Center Branch - Practice Modules */}
          <div className="absolute bottom-[3%] sm:bottom-[7%] left-[10%] sm:left-[22%] flex gap-3">
            <Link href="/workspace/pomodoro" className="block w-40">
              <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-left font-mono transition-all hover:border-cyan-500/40 hover:scale-[1.03] group">
                <div className="flex items-center justify-between text-[8px] font-bold text-cyan-500/50 group-hover:text-cyan-400">
                  <span>FOCUS_SYS</span>
                  <Clock className="h-3 w-3" />
                </div>
                <p className="text-[11px] font-bold mt-0.5 text-slate-100 group-hover:text-cyan-400">POMODORO TẬP TRUNG</p>
              </div>
            </Link>

            <Link href="/tests" className="block w-40">
              <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-left font-mono transition-all hover:border-cyan-500/40 hover:scale-[1.03] group">
                <div className="flex items-center justify-between text-[8px] font-bold text-cyan-500/50 group-hover:text-cyan-400">
                  <span>PRACTICE_SYS</span>
                  <PenTool className="h-3 w-3" />
                </div>
                <p className="text-[11px] font-bold mt-0.5 text-slate-100 group-hover:text-cyan-400">LUYỆN ĐỀ THI</p>
              </div>
            </Link>
          </div>

          <div className="absolute bottom-[3%] sm:bottom-[7%] right-[10%] sm:right-[22%] flex gap-3">
            <Link href="/ai-chat" className="block w-40">
              <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-left font-mono transition-all hover:border-cyan-500/40 hover:scale-[1.03] group">
                <div className="flex items-center justify-between text-[8px] font-bold text-cyan-500/50 group-hover:text-cyan-400">
                  <span>TUTOR_SYS</span>
                  <MessageSquare className="h-3 w-3" />
                </div>
                <p className="text-[11px] font-bold mt-0.5 text-slate-100 group-hover:text-cyan-400">TRỢ LÝ AI CHAT</p>
              </div>
            </Link>

            <button
              onClick={() => setActiveTab('modules')}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-left font-mono transition-all duration-200 w-40 hover:scale-[1.03]",
                activeTab === 'modules'
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              )}
            >
              <div className="flex items-center justify-between text-[8px] font-bold text-cyan-500/70">
                <span>ALL_MODULES</span>
                <Layers className="h-3 w-3" />
              </div>
              <p className="text-[11px] font-bold mt-0.5 text-slate-100">TẤT CẢ TÍNH NĂNG</p>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Content Pane based on selected core node */}
      
      {/* TAB 1: OVERVIEW TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          {/* Stats HUD Panel Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Target & Latest Band */}
            <TechStatCard
              title="IELTS BAND SCORE"
              value={dbData?.ielts.overallBand ? `${dbData.ielts.overallBand} Band` : 'N/A'}
              subtext={
                dbData?.ielts.overallBand
                  ? `L:${dbData.ielts.listeningBand} R:${dbData.ielts.readingBand} W:${dbData.ielts.writingBand} S:${dbData.ielts.speakingBand}`
                  : 'Chưa làm bài thi thử nào'
              }
              icon={Target}
              glowColor="cyan"
            />
            {/* Target Goal Band */}
            <TechStatCard
              title="MỤC TIÊU LỘ TRÌNH"
              value={dbData?.ielts.targetBand ? `${dbData.ielts.targetBand} Band` : '7.5 Target'}
              subtext="Mục tiêu học tập tối thượng"
              icon={Activity}
              glowColor="amber"
            />
            {/* Lexicon / Vocabulary Bank */}
            <TechStatCard
              title="KHO TỪ VỰNG"
              value={`${dbData?.ielts.totalVocab || 0} từ`}
              subtext="Từ vựng IELTS đã ghi nhớ"
              icon={BookOpen}
              glowColor="purple"
            />
            {/* Focus & Streak Cores */}
            <TechStatCard
              title="STREAK HỌC TẬP"
              value={`${dbData?.streak || 0} ngày`}
              subtext={dbData?.streak && dbData.streak > 0 ? '🔥 Chuỗi học tập đang hoạt động!' : 'Chưa có chuỗi học tập'}
              icon={Flame}
              glowColor="emerald"
            />
          </div>

          {/* Telemetry metadata bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 flex items-center justify-between backdrop-blur">
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">SỐ LẦN LUYỆN ĐỀ</p>
                <h3 className="text-lg font-bold text-slate-200 mt-1 font-mono">{dbData?.ielts.totalAttempts || 0} lần</h3>
              </div>
              <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                {dbData?.ielts.totalAttempts || 0}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 flex items-center justify-between backdrop-blur">
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">NGỮ PHÁP ĐÃ HOÀN THÀNH</p>
                <h3 className="text-lg font-bold text-slate-200 mt-1 font-mono">{dbData?.ielts.completedGrammar || 0} chủ đề</h3>
              </div>
              <div className="h-8 w-8 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                {dbData?.ielts.completedGrammar || 0}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 flex items-center justify-between backdrop-blur">
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">TỶ LỆ HOÀN THÀNH NHIỆM VỤ NGÀY</p>
                <h3 className="text-lg font-bold text-slate-200 mt-1 font-mono">
                  {dbData?.tasks.completed || 0}/{dbData?.tasks.total || 0} ({taskCompletionRate}%)
                </h3>
              </div>
              <div className="h-8 w-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                {taskCompletionRate}%
              </div>
            </div>
          </div>

          {/* Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AreaChart */}
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    BIỂU ĐỒ HOÀN THÀNH KẾ HOẠCH TUẦN
                  </h3>
                </div>
              </div>

              {dbData && dbData.weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={dbData.weeklyData}>
                    <defs>
                      <linearGradient id="cyberCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                      tickFormatter={v => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                      domain={[0, 100]}
                      tickFormatter={v => `${v}%`}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: '#f1f5f9',
                      }}
                      formatter={(value: number) => [`${value}%`, 'ĐÃ HOÀN THÀNH']}
                      labelFormatter={label => {
                        const d = new Date(label);
                        return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fill="url(#cyberCyan)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[230px] flex items-center justify-center text-slate-500 font-mono text-[10px]">
                  [ THÔNG BÁO: CHƯA CÓ DỮ LIỆU THỐNG KÊ ]
                </div>
              )}
            </div>

            {/* Pending List */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider mb-4">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  HÀNG ĐỢI NHIỆM VỤ CHỜ
                </h3>

                {dbData && dbData.pendingTasks.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Đã hoàn thành tất cả nhiệm vụ ngày! 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {dbData?.pendingTasks.map(task => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 hover:border-slate-700 transition-colors"
                      >
                        <p className="text-xs font-semibold text-slate-200 truncate">{task.title}</p>
                        <div className="flex items-center justify-between mt-2 text-[9px] font-mono">
                          <span className="bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            {task.knowledgeArea}
                          </span>
                          <span className="text-slate-500">
                            {new Date(task.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="text-[10px] font-mono tracking-widest text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5"
                >
                  TRUY CẬP LỊCH TRÌNH →
                </button>
              </div>
            </div>
          </div>

          {/* Graph & Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Knowledge Map */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider mb-2">
                <Network className="h-4 w-4 text-cyan-400" />
                BẢN ĐỒ LIÊN KẾT CHỦ ĐỀ
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mb-4">Các đỉnh liên kết chủ đề và mức tích lũy học tập</p>

              <div className="w-full flex justify-center bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 relative">
                {graphLayout.nodes.length <= 1 ? (
                  <div className="h-[240px] flex items-center justify-center text-[10px] text-slate-500 font-mono uppercase tracking-widest text-center">
                    [ CHƯA ĐỦ DỮ LIỆU ĐỂ DỰNG BẢN ĐỒ ]
                  </div>
                ) : (
                  <svg viewBox="0 0 400 240" className="w-full h-[240px] select-none">
                    {graphLayout.links.map((link, i) => (
                      <line
                        key={i}
                        x1={link.source.x}
                        y1={link.source.y}
                        x2={link.target.x}
                        y2={link.target.y}
                        stroke="#334155"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                    ))}

                    {graphLayout.nodes.map((node, i) => {
                      const isHovered = hoveredNode === node.id;
                      const radius = isHovered ? node.val * 1.2 : node.val;
                      const fill = node.group === 1
                        ? '#06b6d4'
                        : node.group === 2
                          ? '#f59e0b'
                          : '#a855f7';

                      return (
                        <g
                          key={i}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredNode(node.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={radius}
                            fill={fill}
                            className="transition-all duration-300"
                            style={{ filter: isHovered ? `drop-shadow(0px 0px 8px ${fill})` : '' }}
                          />
                          <text
                            x={node.x}
                            y={node.y + radius + 10}
                            textAnchor="middle"
                            fontSize="8px"
                            fontWeight={node.group === 1 || isHovered ? 'bold' : 'normal'}
                            fill={node.group === 1 || isHovered ? '#e2e8f0' : '#94a3b8'}
                            className="font-mono"
                          >
                            {node.id}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}

                <div className="absolute bottom-2 left-2 text-[8px] font-mono text-slate-500 flex gap-2">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />Trung tâm</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Nhiệm vụ</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-purple-500" />Ghi chú</span>
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider mb-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  BIỂU ĐỒ TẦN SUẤT HOẠT ĐỘNG
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mb-4">Tần suất hoàn thành nhiệm vụ và lưu ghi chú trong 12 tuần qua</p>

                <div className="flex flex-col items-center sm:items-start py-2 overflow-x-auto">
                  <div className="grid grid-flow-col grid-rows-7 gap-1">
                    {heatmapDays.map((day, i) => {
                      let colorClass = 'bg-slate-900/50 border border-slate-800 hover:bg-slate-800/60';
                      if (day.count === 1) colorClass = 'bg-cyan-950 border border-cyan-800 hover:bg-cyan-900';
                      else if (day.count === 2) colorClass = 'bg-cyan-700/60 border border-cyan-500/40 hover:bg-cyan-600';
                      else if (day.count >= 3) colorClass = 'bg-cyan-500 border border-cyan-400 hover:bg-cyan-400';

                      return (
                        <div
                          key={i}
                          className={cn('w-3.5 h-3.5 rounded-sm transition-all duration-150 relative group cursor-pointer', colorClass)}
                        >
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950 text-slate-200 text-[8px] font-mono px-2 py-1 rounded shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                            {day.count} HOẠT ĐỘNG // {day.date.toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between w-full mt-2.5 px-1 text-[8px] font-mono text-slate-500 max-w-[280px] sm:max-w-md">
                    <span>12 TUẦN TRƯỚC</span>
                    <span>HÔM NAY</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-800 pt-4 mt-4 gap-2">
                <span className="text-[8px] font-mono text-slate-500 uppercase">[ HỆ THỐNG ĐANG TỰ ĐỘNG CẬP NHẬT ]</span>
                <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-500">
                  <span>ÍT HƠN</span>
                  <span className="w-3.5 h-3.5 rounded bg-slate-900/50 border border-slate-800" />
                  <span className="w-3.5 h-3.5 rounded bg-cyan-950 border border-cyan-800" />
                  <span className="w-3.5 h-3.5 rounded bg-cyan-700/60 border border-cyan-500/40" />
                  <span className="w-3.5 h-3.5 rounded bg-cyan-500 border border-cyan-400" />
                  <span>NHIỀU HƠN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDY CALENDAR CORE */}
      {activeTab === 'calendar' && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase">
                // STUDY_CALENDAR_CORE
              </h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
                Quản lý lịch kế hoạch học tập hàng ngày
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur">
            <CalendarView plans={plans} onRefresh={fetchPlans} />
          </div>
        </div>
      )}

      {/* TAB 3: APP_CORES INDEX */}
      {activeTab === 'modules' && (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          <div>
            <h2 className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase">
              // ACTIVE_COMMAND_SYSTEMS
            </h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
              Kích hoạt các mô đun học tập chuyên sâu
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/workspace/plans/new" className="group">
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <PlusCircle className="h-14 w-14 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-mono tracking-widest uppercase text-slate-200 mt-3 group-hover:text-cyan-400 transition-colors">
                    PLAN_GENERATOR
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                    Khởi tạo lộ trình và kế hoạch chi tiết từ AI. Phân bổ nhiệm vụ học tập theo thời gian cá nhân.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 mt-4 group-hover:translate-x-1 transition-transform">
                  INITIALISE_MODULE <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link href="/vocabulary" className="group">
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <BookOpen className="h-14 w-14 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-mono tracking-widest uppercase text-slate-200 mt-3 group-hover:text-cyan-400 transition-colors">
                    LEXICON_STORAGE
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                    Hệ thống từ vựng IELTS của bạn. Tra cứu, lưu trữ, học tập qua Flashcards và ví dụ tự động.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 mt-4 group-hover:translate-x-1 transition-transform">
                  INITIALISE_MODULE <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link href="/grammar" className="group">
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <BookText className="h-14 w-14 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <BookText className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-mono tracking-widest uppercase text-slate-200 mt-3 group-hover:text-cyan-400 transition-colors">
                    GRAMMAR_SYNAPSE
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                    Quản lý và ôn tập lý thuyết ngữ pháp IELTS. Học theo dạng sơ đồ tư duy và làm trắc nghiệm kiểm tra.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 mt-4 group-hover:translate-x-1 transition-transform">
                  INITIALISE_MODULE <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link href="/workspace/notes" className="group">
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <NotebookPen className="h-14 w-14 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <NotebookPen className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-mono tracking-widest uppercase text-slate-200 mt-3 group-hover:text-cyan-400 transition-colors">
                    KNOWLEDGE_VAULT
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                    Kho ghi chú cá nhân của bạn, hỗ trợ embedding tự động bằng AI giúp lưu trữ tri thức sâu sắc hơn.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 mt-4 group-hover:translate-x-1 transition-transform">
                  INITIALISE_MODULE <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link href="/workspace/reviews" className="group">
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Brain className="h-14 w-14 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Brain className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-mono tracking-widest uppercase text-slate-200 mt-3 group-hover:text-cyan-400 transition-colors">
                    SYNAPSE_RECALL
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                    Thuật toán Leitner ôn tập giãn cách giúp ghi nhớ kiến thức trọn đời, tự động lên lịch thẻ ôn mỗi ngày.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 mt-4 group-hover:translate-x-1 transition-transform">
                  INITIALISE_MODULE <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link href="/workspace/pomodoro" className="group">
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Clock className="h-14 w-14 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-mono tracking-widest uppercase text-slate-200 mt-3 group-hover:text-cyan-400 transition-colors">
                    CHRONO_FOCUS
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                    Đồng hồ đếm ngược Pomodoro tập trung học tập nâng cao, tích hợp âm thanh và phản hồi hoàn thành.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 mt-4 group-hover:translate-x-1 transition-transform">
                  INITIALISE_MODULE <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
