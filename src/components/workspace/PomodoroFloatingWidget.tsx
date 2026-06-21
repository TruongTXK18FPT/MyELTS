'use client';

import { useState, useRef, useEffect } from 'react';
import { usePomodoro, type TaskData, type PomodoroMode } from '@/providers/PomodoroContext';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronDown,
  CheckCircle,
  ExternalLink,
  Volume2,
  VolumeX,
  Minimize2,
  Music,
  Trees,
  Waves,
  CloudRain,
  X,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

const themeAccents = {
  cozy: {
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    ring: '#06b6d4',
  },
  cyberpunk: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    ring: '#10b981',
  },
  nature: {
    text: 'text-green-400',
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    ring: '#22c55e',
  },
  space: {
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    ring: '#a855f7',
  },
  ocean: {
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    ring: '#f59e0b',
  },
};

export function PomodoroFloatingWidget() {
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    mode,
    timeLeft,
    isRunning,
    focusLength,
    selectedTaskId,
    ambientSound,
    soundEnabled,
    theme,
    tasks,
    loadingTasks,
    isOpen,
    setIsOpen,
    setMode,
    setSelectedTaskId,
    setAmbientSound,
    setSoundEnabled,
    start,
    pause,
    reset,
    markTaskComplete,
    fetchTasks,
  } = usePomodoro();

  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  const activeAccent = themeAccents[theme] || themeAccents.cozy;

  // Don't show floating widget if we are already on the full Pomodoro page
  if (pathname === '/workspace/pomodoro') return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // SVG Progress calculation for the mini floating bubble ring
  const totalDuration = mode === 'focus' ? focusLength * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed bottom-6 left-6 z-50 print:hidden flex flex-col items-start font-mono">
      {/* Control Panel Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[360px] rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-slate-900/80 border-b border-slate-800 p-3 text-slate-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className={cn("h-4 w-4 animate-pulse", activeAccent.text)} />
              <div>
                <h3 className="font-bold text-xs tracking-wider uppercase">CHRONO_FOCUS</h3>
                <p className="text-[9px] text-slate-500">Đồng hồ học tập nền</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/workspace/pomodoro');
                }}
                title="Mở rộng trang tiểu cảnh Pomodoro"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-850 p-1.5 rounded-lg transition-all cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-850 p-1.5 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto scrollbar-thin">
            {/* Mode selector */}
            <div className="flex justify-between items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
              {[
                { id: 'focus', label: 'TẬP TRUNG' },
                { id: 'shortBreak', label: 'NGHỈ NGẮN' },
                { id: 'longBreak', label: 'NGHỈ DÀI' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id as PomodoroMode)}
                  className={cn(
                    "flex-1 text-[8px] sm:text-[9px] py-1 rounded transition-all font-bold tracking-wider",
                    mode === t.id
                      ? cn("border", activeAccent.bg, activeAccent.border, activeAccent.text)
                      : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Big Countdown Timer */}
            <div className="flex flex-col items-center py-2 relative">
              <span className="text-3xl font-extrabold font-mono tracking-wider text-slate-100">
                {formatTime(timeLeft)}
              </span>
              <span className={cn("text-[8px] uppercase tracking-widest mt-1 font-bold", activeAccent.text)}>
                {mode === 'focus' ? '🎯 CHẾ ĐỘ TẬP TRUNG' : '☕ CHẾ ĐỘ NGHỈ NGƠI'}
              </span>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={reset}
                className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 flex items-center justify-center transition-colors cursor-pointer"
                title="Khởi động lại đồng hồ"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={isRunning ? pause : start}
                className={cn(
                  "px-6 h-8 rounded-lg text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer",
                  theme === 'cozy' ? 'bg-cyan-400 hover:bg-cyan-500' :
                  theme === 'cyberpunk' ? 'bg-emerald-400 hover:bg-emerald-500' :
                  theme === 'nature' ? 'bg-green-400 hover:bg-green-500' :
                  theme === 'space' ? 'bg-purple-400 hover:bg-purple-500' :
                  'bg-amber-400 hover:bg-amber-500'
                )}
              >
                {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isRunning ? 'TẠM DỪNG' : 'BẮT ĐẦU'}
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 flex items-center justify-center transition-colors cursor-pointer"
                title="Bật/Tắt âm báo"
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Ambient Audio control */}
            <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Âm thanh mô phỏng</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'none', icon: VolumeX, label: 'Tắt' },
                  { id: 'rain', icon: CloudRain, label: 'Mưa' },
                  { id: 'waves', icon: Waves, label: 'Biển' },
                  { id: 'forest', icon: Trees, label: 'Rừng' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setAmbientSound(s.id as any)}
                    className={cn(
                      "flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all gap-1 text-[8px] uppercase",
                      ambientSound === s.id
                        ? cn("border", activeAccent.bg, activeAccent.border, activeAccent.text, "font-bold")
                        : "bg-slate-900/20 border-slate-850 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <s.icon className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Task Linker */}
            {mode === 'focus' && (
              <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                  <span>Nhiệm vụ học tập</span>
                  <button className="hover:underline text-cyan-400 font-bold" onClick={fetchTasks}>Quét lại</button>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setTaskDropdownOpen(!taskDropdownOpen)}
                    className="w-full flex items-center justify-between text-left text-[10px] bg-slate-900/80 border border-slate-850 p-2 rounded-lg text-slate-200 font-mono focus:outline-none"
                  >
                    <span className="truncate pr-4">
                      {selectedTask
                        ? `${selectedTask.dailyPlan.deepPlan.title} // ${selectedTask.title}`
                        : '-- Chọn nhiệm vụ --'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                  </button>

                  {taskDropdownOpen && (
                    <div className="absolute z-50 bottom-full mb-1 w-full bg-slate-950 border border-slate-800 rounded-lg shadow-xl max-h-32 overflow-y-auto">
                      {tasks.length === 0 ? (
                        <div className="p-2 text-[9px] text-slate-500 text-center uppercase">[ KHÔNG CÓ NHIỆM VỤ ]</div>
                      ) : (
                        tasks.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedTaskId(t.id);
                              setTaskDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left p-2 text-[9px] hover:bg-slate-900 border-b border-slate-900 last:border-0 block truncate",
                              t.id === selectedTaskId ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'text-slate-400'
                            )}
                          >
                            <span className="block font-bold text-[7px] text-cyan-500/70 uppercase">
                              {t.dailyPlan.deepPlan.title}
                            </span>
                            <span className="block truncate mt-0.5">{t.title}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedTask && (
                  <div className="flex items-center justify-between text-[8px] text-slate-400 pt-1">
                    <span>
                      Tiến độ: <span className="font-bold text-cyan-400">{selectedTask.actualMinutes || 0}</span>/{selectedTask.estimatedMinutes}m
                    </span>
                    <button
                      onClick={markTaskComplete}
                      className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline uppercase flex items-center gap-0.5"
                    >
                      <CheckCircle className="h-3 w-3" /> [ HOÀN THÀNH ]
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-900 hover:bg-slate-850 flex items-center justify-center border shadow-xl hover:scale-105 transition-all duration-350 cursor-pointer focus:outline-none relative group",
          activeAccent.border,
          activeAccent.glow
        )}
      >
        {/* Animated outer ring for active running states */}
        {isRunning && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full opacity-10 bg-cyan-400" style={{ animationDuration: '2.5s' }} />
            <span className="absolute inset-[-3px] animate-pulse rounded-full border border-cyan-400/25" style={{ animationDuration: '1.8s' }} />
          </>
        )}

        {/* Circular Countdown Progress Ring */}
        <svg className="absolute inset-0 h-full w-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="#1e293b"
            strokeWidth="2.5"
            fill="transparent"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={activeAccent.ring}
            strokeWidth="2.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Inside icon or countdown text */}
        {isRunning ? (
          <span className={cn("text-[9px] sm:text-[10px] font-bold font-mono tracking-tighter z-10", activeAccent.text)}>
            {formatTime(timeLeft)}
          </span>
        ) : (
          <Clock className={cn("h-5 w-5 z-10", activeAccent.text)} />
        )}

        {/* Hover overlay description */}
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono rounded-lg shadow-xl hidden group-hover:block whitespace-nowrap z-50">
          <p className="font-bold text-[9px] uppercase tracking-wider text-cyan-400">[ CHRONO_FOCUS ]</p>
          <p className="text-slate-400 text-[8px] mt-0.5">
            {mode === 'focus' ? '🎯 Tập trung' : '☕ Giải lao'} • {formatTime(timeLeft)}
          </p>
          {selectedTask && (
            <p className="text-[7px] text-slate-500 mt-1 max-w-[120px] truncate">🎯 {selectedTask.title}</p>
          )}
        </div>
      </button>
    </div>
  );
}
