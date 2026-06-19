'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  NotebookPen,
  Target,
  TrendingUp,
  Brain,
  Network,
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
};

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  gradient: string;
}) {
  return (
    <div className="rounded-2xl border border-pink-100/50 bg-white/80 p-5 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-text-main">{value}</p>
          {subValue && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subValue}</p>
          )}
        </div>
        <div className={cn(
          'h-11 w-11 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105',
          gradient
        )}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/deep-workspace/dashboard');
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) void fetchDashboard();
  }, [session, fetchDashboard]);

  // Generate last 12 weeks dates for activity heatmap
  const heatmapDays = useMemo(() => {
    if (!data) return [];
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get date starting 12 weeks ago (84 days ago)
    const startDate = new Date();
    startDate.setDate(today.getDate() - 83); // 12 weeks total

    const activityMap = new Map(data.heatmapData.map(h => [h.date, h.count]));

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
  }, [data]);

  // Calculate SVG Node coordinates for Force-style Knowledge Graph
  const graphLayout = useMemo(() => {
    if (!data || !data.knowledgeGraph) return { nodes: [], links: [] };

    const { nodes, links } = data.knowledgeGraph;
    if (nodes.length <= 1) return { nodes: [], links: [] };

    const centerX = 250;
    const centerY = 150;
    const count = nodes.length - 1; // Exclude center node

    // Center node
    const computedNodes = [
      { id: nodes[0].id, x: centerX, y: centerY, val: nodes[0].val, group: nodes[0].group }
    ];

    // Radial distribution for sub-nodes
    nodes.slice(1).forEach((node, i) => {
      const angle = (i * 2 * Math.PI) / count;
      const radius = 95 + (i % 2 === 0 ? 0 : 25); // Alternate radius to prevent overlapping
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
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không thể tải dữ liệu bảng điều khiển</p>
      </div>
    );
  }

  const taskCompletionRate = data.tasks.total > 0
    ? Math.round((data.tasks.completed / data.tasks.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Bảng Điều Khiển</h1>
          <p className="text-sm text-muted-foreground">
            Tổng quan tiến độ học tập và phân tích kiến thức
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Kế hoạch"
          value={data.plans.total}
          subValue={`${data.plans.active} đang hoạt động • ${data.plans.completed} hoàn thành`}
          color="text-white"
          gradient="bg-gradient-to-br from-pink-500 to-rose-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Nhiệm vụ hoàn thành"
          value={`${data.tasks.completed}/${data.tasks.total}`}
          subValue={`${taskCompletionRate}% tổng tiến độ`}
          color="text-white"
          gradient="bg-gradient-to-br from-emerald-400 to-green-500"
        />
        <StatCard
          icon={NotebookPen}
          label="Ghi chú học tập"
          value={data.notes.total}
          subValue="Ghi chú thu hoạch được"
          color="text-white"
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
        />
        <StatCard
          icon={Flame}
          label="Chuỗi học tập"
          value={`${data.streak} ngày`}
          subValue={data.streak > 0 ? '🔥 Tuyệt vời! Duy trì liên tục nhé.' : 'Bắt đầu tích lũy chuỗi ngay hôm nay.'}
          color="text-white"
          gradient="bg-gradient-to-br from-red-400 to-rose-500"
        />
      </div>

      {/* Main Charts & Side Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-pink-100/50 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 text-text-main">
                <TrendingUp className="h-4 w-4 text-pink-500" />
                Xu hướng hoàn thành kế hoạch
              </h3>
              <p className="text-xs text-muted-foreground">Kế hoạch hàng ngày trong 4 tuần gần nhất</p>
            </div>
          </div>

          {data.weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.weeklyData}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec407a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec407a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={v => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #f3d1e4',
                    fontSize: '11px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Hoàn thành']}
                  labelFormatter={label => {
                    const d = new Date(label);
                    return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#ec407a"
                  strokeWidth={2.5}
                  fill="url(#completionGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-xs">
              Chưa có dữ liệu học tập.
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="rounded-2xl border border-pink-100/50 bg-white/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 text-text-main">
              <Clock className="h-4 w-4 text-pink-500" />
              Công việc còn thiếu
            </h3>

            {data.pendingTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Hoàn thành tất cả nhiệm vụ xuất sắc! 🎉</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {data.pendingTasks.map(task => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-pink-100/40 p-2.5 hover:border-pink-200 transition-colors bg-white"
                  >
                    <p className="text-xs font-semibold text-text-main line-clamp-1">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded">
                        <BookOpen className="h-2.5 w-2.5 text-pink-500" />
                        {task.knowledgeArea}
                      </span>
                      <span>
                        {new Date(task.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                      </span>
                      {task.status === 'IN_PROGRESS' && (
                        <span className="text-emerald-500 font-bold">Đang làm</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
            <Link href="/workspace">
              <span className="text-xs font-semibold text-pink-600 hover:text-pink-700 hover:underline">
                Xem lịch trình đầy đủ →
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Heatmap & Knowledge Graph Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Knowledge Graph */}
        <div className="rounded-2xl border border-pink-100/50 bg-white/80 p-5 shadow-sm lg:col-span-1">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3 text-text-main">
            <Network className="h-4 w-4 text-pink-500 animate-pulse" />
            Đồ thị kiến thức cá nhân
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Các chủ đề bạn đã thực hiện qua nhiệm vụ và ghi chú</p>

          <div className="w-full flex justify-center bg-slate-50/50 rounded-xl p-3 border border-pink-50/30 relative">
            {graphLayout.nodes.length <= 1 ? (
              <div className="h-[300px] flex items-center justify-center text-xs text-muted-foreground text-center">
                Không đủ dữ liệu chủ đề. Hãy tạo thêm các task học và ghi chú để AI vẽ đồ thị!
              </div>
            ) : (
              <svg viewBox="0 0 500 300" className="w-full h-[300px] select-none">
                {/* Connection lines */}
                {graphLayout.links.map((link, i) => (
                  <line
                    key={i}
                    x1={link.source.x}
                    y1={link.source.y}
                    x2={link.target.x}
                    y2={link.target.y}
                    stroke="#F8BBD0"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />
                ))}

                {/* Nodes */}
                {graphLayout.nodes.map((node, i) => {
                  const isHovered = hoveredNode === node.id;
                  const radius = isHovered ? node.val * 1.3 : node.val;
                  const fill = node.group === 1
                    ? '#ec407a' // Central Workspace node (deep pink)
                    : node.group === 2
                      ? '#f472b6' // Task Knowledge areas (soft pink)
                      : '#fb7185'; // Note tag topics (rose/peach)

                  return (
                    <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={fill}
                        className="transition-all duration-300 shadow-sm"
                        style={{ filter: isHovered ? 'drop-shadow(0px 0px 6px rgba(236, 64, 122, 0.6))' : '' }}
                      />
                      <text
                        x={node.x}
                        y={node.y + radius + 11}
                        textAnchor="middle"
                        fontSize={node.group === 1 ? '11px' : '9px'}
                        fontWeight={node.group === 1 || isHovered ? 'bold' : 'normal'}
                        fill={node.group === 1 ? '#3A3A3A' : '#6B6B6B'}
                        className="bg-white/80"
                      >
                        {node.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Float helper */}
            <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground flex gap-3">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-500" />Trung tâm</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-400" />Nhiệm vụ</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />Ghi chú</span>
            </div>
          </div>
        </div>

        {/* GitHub-style Activity Heatmap */}
        <div className="rounded-2xl border border-pink-100/50 bg-white/80 p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3 text-text-main">
              <Brain className="h-4 w-4 text-pink-500" />
              Tần suất hoạt động học tập
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Mật độ hoàn thành nhiệm vụ và lưu trữ ghi chú trong 12 tuần gần nhất</p>

            <div className="flex flex-col items-center sm:items-start overflow-x-auto py-2">
              {/* Heatmap grid */}
              <div className="grid grid-flow-col grid-rows-7 gap-1.5">
                {heatmapDays.map((day, i) => {
                  let colorClass = 'bg-slate-50 border border-slate-100 hover:bg-slate-100/60';
                  if (day.count === 1) colorClass = 'bg-pink-100 border border-pink-200 hover:bg-pink-200/80';
                  else if (day.count === 2) colorClass = 'bg-pink-300 border border-pink-400 hover:bg-pink-400/80';
                  else if (day.count >= 3) colorClass = 'bg-pink-500 border border-pink-600 hover:bg-pink-600/80';

                  return (
                    <div
                      key={i}
                      className={cn('w-4 h-4 rounded-sm transition-all duration-150 relative group cursor-pointer', colorClass)}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-55 whitespace-nowrap">
                        {day.count} hoạt động vào {day.date.toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Labels for months/weekdays */}
              <div className="flex justify-between w-full mt-3 px-1 text-[9px] text-muted-foreground max-w-[280px] sm:max-w-md">
                <span>12 tuần trước</span>
                <span>Hôm nay</span>
              </div>
            </div>
          </div>

          {/* Color Indicators Legend */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
            <span className="text-[10px] text-muted-foreground">Tự động tích lũy khi tích hoàn thành task hoặc lưu note.</span>
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <span>Ít</span>
              <span className="w-3.5 h-3.5 rounded-sm bg-slate-50 border border-slate-100" />
              <span className="w-3.5 h-3.5 rounded-sm bg-pink-100 border border-pink-200" />
              <span className="w-3.5 h-3.5 rounded-sm bg-pink-300 border border-pink-400" />
              <span className="w-3.5 h-3.5 rounded-sm bg-pink-500 border border-pink-600" />
              <span>Nhiều</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Distribution (Simple details block) */}
      <div className="rounded-2xl border border-pink-100/50 bg-white/80 p-5 shadow-sm">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 text-text-main">
          <BarChart3 className="h-4 w-4 text-pink-500" />
          Phân bố trạng thái nhiệm vụ
        </h3>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Chưa làm', value: data.tasks.pending, color: 'bg-slate-200', textColor: 'text-slate-600' },
            { label: 'Đang làm', value: data.tasks.inProgress, color: 'bg-pink-200', textColor: 'text-pink-600' },
            { label: 'Hoàn thành', value: data.tasks.completed, color: 'bg-emerald-200', textColor: 'text-emerald-600' },
            { label: 'Tổng số', value: data.tasks.total, color: 'bg-blue-200', textColor: 'text-blue-600' },
          ].map((item) => (
            <div key={item.label} className="text-center rounded-xl bg-slate-50/50 p-3 border border-pink-50/30">
              <div className={cn('text-xl font-bold', item.textColor)}>{item.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{item.label}</div>
              <div className={cn('h-1.5 rounded-full mt-2', item.color)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
