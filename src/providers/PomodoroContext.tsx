'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';
export type AmbientSoundType = 'none' | 'rain' | 'waves' | 'forest';
export type PomodoroThemeType = 'cozy' | 'cyberpunk' | 'nature' | 'space' | 'ocean';

export type TaskData = {
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

interface PomodoroContextType {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  focusLength: number;
  selectedTaskId: string;
  ambientSound: AmbientSoundType;
  soundEnabled: boolean;
  theme: PomodoroThemeType;
  isMinimized: boolean;
  isOpen: boolean;
  tasks: TaskData[];
  loadingTasks: boolean;
  
  setMode: (mode: PomodoroMode) => void;
  setTimeLeft: (time: number) => void;
  setIsRunning: (running: boolean) => void;
  setFocusLength: (length: number) => void;
  setSelectedTaskId: (id: string) => void;
  setAmbientSound: (sound: AmbientSoundType) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setTheme: (theme: PomodoroThemeType) => void;
  setIsMinimized: (minimized: boolean) => void;
  setIsOpen: (open: boolean) => void;
  
  start: () => void;
  pause: () => void;
  reset: () => void;
  fetchTasks: () => Promise<void>;
  markTaskComplete: () => Promise<void>;
  updateTaskMinutes: (minutes: number) => Promise<void>;
}

const PomodoroContext = createContext<PomodoroContextType | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [focusLength, setFocusLength] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('none');
  const [theme, setTheme] = useState<PomodoroThemeType>('cozy');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [loadingTasks, setLoadingTasks] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodesRef = useRef<{ source: AudioNode; gain: GainNode } | null>(null);

  // Fetch pending tasks
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch('/api/deep-workspace/tasks/pending');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        if (data.length > 0 && !selectedTaskId) {
          // Keep previous selection or select first
          setSelectedTaskId((prev) => {
            const stillExists = data.some((t: TaskData) => t.id === prev);
            return stillExists ? prev : data[0].id;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch pending tasks in context:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  // Adjust time when focus length or mode changes
  useEffect(() => {
    if (mode === 'focus') {
      setTimeLeft(focusLength * 60);
    } else if (mode === 'shortBreak') {
      setTimeLeft(5 * 60);
    } else {
      setTimeLeft(15 * 60);
    }
    setIsRunning(false);
  }, [mode, focusLength]);

  // Stop ambient audio synthesis
  const stopAmbient = useCallback(() => {
    if (ambientNodesRef.current) {
      try {
        ambientNodesRef.current.source.disconnect();
        ambientNodesRef.current.gain.disconnect();
      } catch (e) {
        console.error('Error stopping ambient audio:', e);
      }
      ambientNodesRef.current = null;
    }
  }, []);

  // Web Audio synthetic ambient sounds
  const startAmbient = useCallback((type: 'rain' | 'waves' | 'forest') => {
    stopAmbient();
    if (!soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'waves' || type === 'rain') {
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        } else {
          output[i] = (lastOut + (0.12 * white)) / 1.12;
          lastOut = output[i];
          output[i] *= 2.5;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      
      const gainNode = ctx.createGain();

      if (type === 'rain') {
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        
        const mod = ctx.createOscillator();
        mod.frequency.setValueAtTime(8, ctx.currentTime);
        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(0.03, ctx.currentTime);
        mod.connect(modGain);
        modGain.connect(gainNode.gain);
        mod.start();
      } else if (type === 'waves') {
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        lfo.start();
      } else {
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.05, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        lfo.start();
      }

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      whiteNoise.start();

      ambientNodesRef.current = { source: whiteNoise, gain: gainNode };
    } catch (e) {
      console.error('Ambient synthesis error:', e);
    }
  }, [stopAmbient, soundEnabled]);

  // Synchronize ambient sound
  useEffect(() => {
    if (ambientSound !== 'none' && isRunning) {
      startAmbient(ambientSound);
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [ambientSound, isRunning, startAmbient, stopAmbient]);

  // Beep sound alert
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
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

      playBeep(0, 0.25, 523.25); // C5
      playBeep(0.3, 0.25, 587.33); // D5
      playBeep(0.6, 0.5, 659.25); // E5
    } catch (e) {
      console.error(e);
    }
  }, [soundEnabled]);

  const updateTaskMinutes = useCallback(async (minutes: number) => {
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    if (!selectedTask) return;
    
    try {
      const currentMinutes = selectedTask.actualMinutes || 0;
      const nextMinutes = currentMinutes + minutes;

      const response = await fetch(`/api/deep-workspace/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualMinutes: nextMinutes }),
      });

      if (response.ok) {
        toast({
          title: 'Cập nhật tiến độ',
          description: `Đã ghi nhận thêm ${minutes} phút thực tế vào nhiệm vụ "${selectedTask.title}".`,
        });
        void fetchTasks();
      }
    } catch (err) {
      console.error('Error logging Pomodoro minutes:', err);
    }
  }, [tasks, selectedTaskId, fetchTasks, toast]);

  // Complete session handler
  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    stopAmbient();
    playAlertSound();

    if (mode === 'focus') {
      toast({
        title: 'Tuyệt vời! Phiên tập trung hoàn thành 🎉',
        description: `Chúc mừng bạn đã hoàn thành ${focusLength} phút học tập tập trung!`,
      });

      if (selectedTaskId) {
        await updateTaskMinutes(focusLength);
      }
      setMode('shortBreak');
    } else {
      toast({
        title: 'Hết giờ nghỉ ngơi ☕',
        description: 'Đã đến lúc tiếp tục hành trình học tập!',
      });
      setMode('focus');
    }
  }, [mode, playAlertSound, selectedTaskId, focusLength, updateTaskMinutes, stopAmbient, toast]);

  // Countdown timer ticking effect
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

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    stopAmbient();
    if (mode === 'focus') setTimeLeft(focusLength * 60);
    else if (mode === 'shortBreak') setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  }, [mode, focusLength, stopAmbient]);

  const markTaskComplete = useCallback(async () => {
    if (!selectedTaskId) return;
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
      console.error('Error completing task:', err);
    }
  }, [selectedTaskId, fetchTasks, toast]);

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        timeLeft,
        isRunning,
        focusLength,
        selectedTaskId,
        ambientSound,
        soundEnabled,
        theme,
        isMinimized,
        isOpen,
        tasks,
        loadingTasks,
        
        setMode,
        setTimeLeft,
        setIsRunning,
        setFocusLength,
        setSelectedTaskId,
        setAmbientSound,
        setSoundEnabled,
        setTheme,
        setIsMinimized,
        setIsOpen,
        
        start,
        pause,
        reset,
        fetchTasks,
        markTaskComplete,
        updateTaskMinutes,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
