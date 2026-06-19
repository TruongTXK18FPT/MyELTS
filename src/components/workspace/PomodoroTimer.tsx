'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Clock, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Task = {
  id: string;
  title: string;
  actualMinutes: number | null;
  estimatedMinutes: number;
  dailyPlan: {
    date: string;
    deepPlan: {
      title: string;
    };
  };
};

export function PomodoroTimer({ compact = false }: { compact?: boolean }) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch pending tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/deep-workspace/tasks/pending');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        if (data.length > 0 && !selectedTaskId) {
          setSelectedTaskId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch pending tasks:', err);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  // Set time left based on mode
  useEffect(() => {
    if (mode === 'focus') {
      setTimeLeft(25 * 60);
    } else if (mode === 'shortBreak') {
      setTimeLeft(5 * 60);
    } else {
      setTimeLeft(15 * 60);
    }
    setIsRunning(false);
  }, [mode]);

  // Play a simple beep sound using Web Audio API
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Play 3 beeps
      const playBeep = (delay: number, duration: number, frequency: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      playBeep(0, 0.2, 523.25); // C5
      playBeep(0.3, 0.2, 587.33); // D5
      playBeep(0.6, 0.4, 659.25); // E5
    } catch (e) {
      console.error('Audio play error:', e);
    }
  }, [soundEnabled]);

  // Handle countdown finished
  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    playAlertSound();

    if (mode === 'focus') {
      toast({
        title: 'Chúc mừng! 🎉',
        description: 'Bạn đã hoàn thành 1 phiên tập trung Pomodoro (25 phút).',
        variant: 'default',
      });

      const selectedTask = tasks.find((t) => t.id === selectedTaskId);
      if (selectedTask) {
        setLoading(true);
        try {
          const currentMinutes = selectedTask.actualMinutes || 0;
          const nextMinutes = currentMinutes + 25;

          // Update actualMinutes
          const response = await fetch(`/api/deep-workspace/tasks/${selectedTask.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actualMinutes: nextMinutes }),
          });

          if (response.ok) {
            toast({
              title: 'Cập nhật thời gian',
              description: `Đã ghi nhận thêm 25 phút thực tế cho nhiệm vụ "${selectedTask.title}".`,
            });
            void fetchTasks();
          }
        } catch (err) {
          console.error('Error logging Pomodoro minutes:', err);
        } finally {
          setLoading(false);
        }
      }

      setMode('shortBreak');
    } else {
      toast({
        title: 'Hết giờ giải lao! ⏰',
        description: 'Hãy bắt đầu một phiên tập trung mới nào.',
      });
      setMode('focus');
    }
  }, [mode, playAlertSound, tasks, selectedTaskId, fetchTasks, toast]);

  // Tick timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            void handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, handleTimerComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'focus') setTimeLeft(25 * 60);
    else if (mode === 'shortBreak') setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMarkComplete = async () => {
    if (!selectedTaskId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/deep-workspace/tasks/${selectedTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (response.ok) {
        toast({
          title: 'Hoàn thành nhiệm vụ',
          description: 'Đã cập nhật trạng thái nhiệm vụ thành Hoàn thành!',
        });
        setSelectedTaskId('');
        void fetchTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-pink-50/40 border border-pink-100/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-pink-500 animate-pulse" />
          <span className="font-mono text-sm font-bold text-pink-700">{formatTime(timeLeft)}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-pink-600 hover:text-pink-700 hover:bg-pink-100/60"
            onClick={toggleTimer}
          >
            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col p-4 rounded-2xl bg-gradient-to-br from-white to-pink-50/20 border border-pink-100/60 shadow-sm transition-all duration-300">
      {/* Mode selection tabs */}
      <div className="flex justify-between items-center gap-1 bg-pink-50/50 p-1 rounded-xl border border-pink-100/30">
        <button
          onClick={() => setMode('focus')}
          className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${
            mode === 'focus'
              ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white font-medium shadow-sm'
              : 'text-muted-foreground hover:bg-pink-50/80 hover:text-foreground'
          }`}
        >
          Tập trung
        </button>
        <button
          onClick={() => setMode('shortBreak')}
          className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${
            mode === 'shortBreak'
              ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white font-medium shadow-sm'
              : 'text-muted-foreground hover:bg-pink-50/80 hover:text-foreground'
          }`}
        >
          Nghỉ ngắn
        </button>
        <button
          onClick={() => setMode('longBreak')}
          className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${
            mode === 'longBreak'
              ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white font-medium shadow-sm'
              : 'text-muted-foreground hover:bg-pink-50/80 hover:text-foreground'
          }`}
        >
          Nghỉ dài
        </button>
      </div>

      {/* Timer display */}
      <div className="flex flex-col items-center py-6 relative">
        <span className="font-headline text-5xl font-extrabold font-mono tracking-tight bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
          {formatTime(timeLeft)}
        </span>
        <span className="text-[10px] mt-1 uppercase font-semibold tracking-wider text-pink-400">
          {mode === 'focus' ? '🎯 Phiên tập trung' : '☕ Thời gian nghỉ'}
        </span>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
          onClick={resetTimer}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          size="lg"
          onClick={toggleTimer}
          className="rounded-full px-8 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white shadow-md shadow-pink-200 border-none transition-all duration-300"
        >
          {isRunning ? <Pause className="h-5 w-5 mr-1" /> : <Play className="h-5 w-5 mr-1" />}
          {isRunning ? 'Tạm dừng' : 'Bắt đầu'}
        </Button>

        <Button
          size="icon"
          variant="outline"
          className="rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {/* Task Selector */}
      {mode === 'focus' && (
        <div className="mt-4 pt-4 border-t border-pink-100/50 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
            <span>Nhiệm vụ liên kết</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent text-pink-600 hover:text-pink-700"
              onClick={() => void fetchTasks()}
            >
              Tải lại
            </Button>
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between text-left text-xs bg-pink-50/20 hover:bg-pink-50/40 border border-pink-100/60 p-2.5 rounded-xl text-text-main font-medium focus:outline-none transition-all"
            >
              <span className="truncate pr-4">
                {selectedTask
                  ? `${selectedTask.dailyPlan.deepPlan.title} - ${selectedTask.title}`
                  : '-- Chọn nhiệm vụ tập trung --'}
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-pink-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-pink-100/60 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">
                    Không có nhiệm vụ chưa hoàn thành nào.
                  </div>
                ) : (
                  tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 text-xs hover:bg-pink-50/40 transition-colors border-b border-pink-50 last:border-0 block truncate ${
                        t.id === selectedTaskId ? 'bg-pink-50/50 text-pink-700 font-semibold' : 'text-text-main'
                      }`}
                    >
                      <span className="block font-semibold text-[10px] text-pink-500 uppercase tracking-wider">
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
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground">
                Tiến độ: {selectedTask.actualMinutes || 0}/{selectedTask.estimatedMinutes} phút
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={handleMarkComplete}
                className="h-6 px-2 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Xong luôn
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
