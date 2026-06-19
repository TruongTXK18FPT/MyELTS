'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { PlanWithDailyPlans } from '@/app/workspace/page';

type ViewMode = 'month' | 'week';

type Props = {
  plans: PlanWithDailyPlans[];
  onRefresh: () => void;
};

const WEEKDAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VN = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days: (Date | null)[] = [];

  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

function getWeekDays(baseDate: Date) {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return 'bg-emerald-400';
    case 'IN_PROGRESS': return 'bg-pink-400';
    case 'APPROVED': return 'bg-blue-400';
    case 'DRAFT': return 'bg-amber-400';
    default: return 'bg-slate-300';
  }
}

function getCompletionColor(rate: number) {
  if (rate >= 80) return 'text-emerald-600';
  if (rate >= 50) return 'text-blue-600';
  if (rate > 0) return 'text-amber-600';
  return 'text-slate-400';
}

export function CalendarView({ plans, onRefresh }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build a map of date -> daily plans
  const dailyPlanMap = useMemo(() => {
    const map = new Map<string, {
      planId: string;
      planTitle: string;
      planTopic: string;
      dailyPlan: PlanWithDailyPlans['dailyPlans'][0];
    }[]>();

    for (const plan of plans) {
      for (const dp of plan.dailyPlans) {
        const dateKey = new Date(dp.date).toISOString().split('T')[0];
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push({
          planId: plan.id,
          planTitle: plan.title,
          planTopic: plan.topic,
          dailyPlan: dp,
        });
      }
    }

    return map;
  }, [plans]);

  const navigate = (delta: number) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + delta);
    } else {
      d.setDate(d.getDate() + delta * 7);
    }
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const days = viewMode === 'month'
    ? getMonthDays(currentDate.getFullYear(), currentDate.getMonth())
    : getWeekDays(currentDate);

  const selectedDateKey = selectedDate?.toISOString().split('T')[0];
  const selectedDayPlans = selectedDateKey ? dailyPlanMap.get(selectedDateKey) || [] : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-8 w-8 p-0 border-pink-100 hover:bg-pink-50/50 hover:text-pink-600">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center text-text-main">
            {viewMode === 'month'
              ? `${MONTHS_VN[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Tuần ${Math.ceil(currentDate.getDate() / 7)} - ${MONTHS_VN[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            }
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate(1)} className="h-8 w-8 p-0 border-pink-100 hover:bg-pink-50/50 hover:text-pink-600">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs text-pink-600 hover:text-pink-700 hover:bg-pink-50/50">
            Hôm nay
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-pink-100 overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('month')}
              className={cn(
                'rounded-none h-8 px-3 text-xs',
                viewMode === 'month' ? 'bg-pink-50 text-pink-700 font-medium' : 'text-muted-foreground hover:bg-pink-50/20'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" />
              Tháng
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('week')}
              className={cn(
                'rounded-none h-8 px-3 text-xs',
                viewMode === 'week' ? 'bg-pink-50 text-pink-700 font-medium' : 'text-muted-foreground hover:bg-pink-50/20'
              )}
            >
              <List className="h-3.5 w-3.5 mr-1" />
              Tuần
            </Button>
          </div>

          <Link href="/workspace/plans/new">
            <Button size="sm" className="bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:from-pink-600 hover:to-rose-500 shadow-md shadow-pink-100 h-8 text-xs border-none">
              + Tạo kế hoạch
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendar Grid */}
        <div className="flex-1 rounded-2xl border border-pink-100/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-pink-50/30 to-pink-100/20 border-b border-pink-100/40">
            {WEEKDAYS_VN.map((day, i) => (
              <div
                key={day}
                className={cn(
                  'py-3 text-center text-xs font-semibold',
                  i === 0 ? 'text-red-400' : 'text-muted-foreground'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className={cn(
            'grid grid-cols-7',
            viewMode === 'week' ? 'min-h-[200px]' : ''
          )}>
            {days.map((day, idx) => {
              if (!day) {
                return <div key={`pad-${idx}`} className="min-h-[100px] border-b border-r border-pink-50/30 bg-slate-50/20" />;
              }

              const dateKey = day.toISOString().split('T')[0];
              const dayPlans = dailyPlanMap.get(dateKey) || [];
              const today = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'min-h-[100px] border-b border-r border-pink-50/30 p-1.5 text-left transition-all duration-150 hover:bg-pink-50/20 relative group',
                    viewMode === 'week' ? 'min-h-[180px]' : '',
                    isSelected ? 'bg-pink-50/30 ring-2 ring-pink-200 ring-inset' : '',
                    !isCurrentMonth && viewMode === 'month' ? 'opacity-40' : ''
                  )}
                >
                  {/* Day Number */}
                  <div className={cn(
                    'text-sm font-medium mb-1 flex items-center justify-center w-7 h-7 rounded-full transition-colors',
                    today
                      ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-sm font-semibold'
                      : day.getDay() === 0
                        ? 'text-red-400'
                        : 'text-text-main',
                  )}>
                    {day.getDate()}
                  </div>

                  {/* Daily Plan Indicators */}
                  <div className="space-y-0.5">
                    {dayPlans.slice(0, 3).map((dp, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] truncate transition-all',
                          dp.dailyPlan.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : dp.dailyPlan.status === 'APPROVED' || dp.dailyPlan.status === 'IN_PROGRESS'
                              ? 'bg-pink-50 text-pink-700'
                              : 'bg-amber-50 text-amber-700'
                        )}
                      >
                        <div className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', getStatusColor(dp.dailyPlan.status))} />
                        <span className="truncate">{dp.planTopic}</span>
                      </div>
                    ))}
                    {dayPlans.length > 3 && (
                      <div className="text-[10px] text-muted-foreground pl-1">
                        +{dayPlans.length - 3} thêm
                      </div>
                    )}
                  </div>

                  {/* Completion indicator */}
                  {dayPlans.length > 0 && (
                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={cn(
                        'text-[10px] font-medium',
                        getCompletionColor(dayPlans[0].dailyPlan.completionRate)
                      )}>
                        {Math.round(dayPlans[0].dailyPlan.completionRate)}%
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail Panel */}
        {selectedDate && (
          <div className="w-full lg:w-80 rounded-2xl border border-pink-100/60 bg-white/90 backdrop-blur-sm shadow-sm overflow-hidden flex-shrink-0">
            <div className="bg-gradient-to-r from-pink-50/40 to-pink-100/20 p-4 border-b border-pink-100/40">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-pink-500" />
                <div>
                  <h3 className="font-semibold text-sm text-text-main">
                    {selectedDate.toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedDayPlans.length > 0
                      ? `${selectedDayPlans.length} kế hoạch`
                      : 'Không có kế hoạch'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedDayPlans.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Chưa có kế hoạch</p>
                  <Link href="/workspace/plans/new">
                    <Button variant="outline" size="sm" className="mt-3 text-xs border-pink-100 text-pink-600 hover:bg-pink-50/50">
                      + Tạo kế hoạch mới
                    </Button>
                  </Link>
                </div>
              ) : (
                selectedDayPlans.map((dp, i) => (
                  <Link
                    key={i}
                    href={`/workspace/plans/${dp.planId}`}
                    className="block rounded-xl border border-pink-100/40 p-3 hover:border-pink-200 hover:shadow-sm transition-all bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pink-50 text-pink-600">
                          {dp.planTopic}
                        </span>
                        <h4 className="font-medium text-sm mt-1.5 line-clamp-2 text-text-main">{dp.planTitle}</h4>
                      </div>
                      <div className={cn(
                        'h-2 w-2 rounded-full flex-shrink-0 mt-1',
                        getStatusColor(dp.dailyPlan.status)
                      )} />
                    </div>

                    {/* Time slot */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Clock className="h-3 w-3" />
                      {dp.dailyPlan.timeSlotStart} - {dp.dailyPlan.timeSlotEnd}
                    </div>

                    {/* Tasks preview */}
                    <div className="space-y-1">
                      {dp.dailyPlan.tasks.slice(0, 4).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 text-xs text-text-main"
                        >
                          {task.status === 'COMPLETED' ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                          ) : task.status === 'IN_PROGRESS' ? (
                            <Clock className="h-3 w-3 text-pink-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-slate-300 flex-shrink-0" />
                          )}
                          <span className={cn(
                            'truncate',
                            task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''
                          )}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {dp.dailyPlan.tasks.length > 4 && (
                        <p className="text-[10px] text-muted-foreground pl-5">
                          +{dp.dailyPlan.tasks.length - 4} nhiệm vụ khác
                        </p>
                      )}
                    </div>

                    {/* Completion bar */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Tiến độ</span>
                        <span className={cn('font-medium', getCompletionColor(dp.dailyPlan.completionRate))}>
                          {Math.round(dp.dailyPlan.completionRate)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-300 transition-all duration-500"
                          style={{ width: `${dp.dailyPlan.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
