'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Clock, Volume2, VolumeX, ChevronDown, Sparkles, BookOpen, Music, Waves, CloudRain, Trees, ChevronLeft, Radio, Headphones, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';
import cozyStudyBg from '@/assets/cozy_study_lofi.png';
import Link from 'next/link';
import { useMusic, type MusicTrackData } from '@/providers/MusicContext';

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

export default function PomodoroPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [focusLength, setFocusLength] = useState(25); // Custom length in minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'waves' | 'forest'>('none');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Music Context state and local track list
  const { play, playPlaylist, currentTrack, isPlaying } = useMusic();
  const [importedTracks, setImportedTracks] = useState<MusicTrackData[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);

  // Fetch all imported tracks from the database
  useEffect(() => {
    const fetchImportedTracks = async () => {
      try {
        const res = await fetch('/api/music/tracks?limit=100');
        if (res.ok) {
          const data = await res.json();
          setImportedTracks(data.tracks || []);
        }
      } catch (err) {
        console.error('Error fetching tracks inside Pomodoro:', err);
      } finally {
        setLoadingTracks(false);
      }
    };
    void fetchImportedTracks();
  }, []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodesRef = useRef<{ source: AudioNode; gain: GainNode } | null>(null);

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
      console.error(err);
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

  // Stop ambient audio
  const stopAmbient = useCallback(() => {
    if (ambientNodesRef.current) {
      try {
        ambientNodesRef.current.source.disconnect();
        ambientNodesRef.current.gain.disconnect();
      } catch (e) {
        console.error(e);
      }
      ambientNodesRef.current = null;
    }
  }, []);

  // Web Audio synthetic sounds (White/Brown noise generation)
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

      // Fill buffer with noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'waves' || type === 'rain') {
          // Brown noise filter for waves and rain
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Compensate loss
        } else {
          // Pink noise filter for forest wind
          output[i] = (lastOut + (0.12 * white)) / 1.12;
          lastOut = output[i];
          output[i] *= 2.5;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter to shape the sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      
      const gainNode = ctx.createGain();

      if (type === 'rain') {
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        
        // Fast amplitude modulation to simulate crackling rain drops
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

        // LFO to simulate slow ocean waves rolling in and out (10s cycle)
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        lfo.start();
      } else { // forest wind
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);

        // LFO to simulate random gusts of wind
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

  // Handle ambient selection changes
  useEffect(() => {
    if (ambientSound !== 'none' && isRunning) {
      startAmbient(ambientSound);
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [ambientSound, isRunning, startAmbient, stopAmbient]);

  // Play a simple beep sound on complete
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

  // Complete timer handler
  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    stopAmbient();
    playAlertSound();

    if (mode === 'focus') {
      toast({
        title: 'Tuyệt vời! Phiên tập trung hoàn thành 🎉',
        description: `Chúc mừng bạn đã hoàn thành ${focusLength} phút học tập tập trung!`,
      });

      const selectedTask = tasks.find((t) => t.id === selectedTaskId);
      if (selectedTask) {
        setLoading(true);
        try {
          const currentMinutes = selectedTask.actualMinutes || 0;
          const nextMinutes = currentMinutes + focusLength;

          // Update actualMinutes on server
          const response = await fetch(`/api/deep-workspace/tasks/${selectedTask.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actualMinutes: nextMinutes }),
          });

          if (response.ok) {
            toast({
              title: 'Cập nhật tiến độ',
              description: `Đã ghi nhận thêm ${focusLength} phút thực tế vào nhiệm vụ "${selectedTask.title}".`,
            });
            void fetchTasks();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }

      setMode('shortBreak');
    } else {
      toast({
        title: 'Hết giờ nghỉ ngơi ☕',
        description: 'Đã đến lúc tiếp tục hành trình học tập!',
      });
      setMode('focus');
    }
  }, [mode, playAlertSound, tasks, selectedTaskId, focusLength, fetchTasks, toast, stopAmbient]);

  // Tick countdown timer
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
    stopAmbient();
    if (mode === 'focus') setTimeLeft(focusLength * 60);
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

  // SVG Progress circle calculations
  const totalDuration = mode === 'focus' ? focusLength * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Back to Workspace button */}
      <Link
        href="/workspace"
        className="inline-flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 tracking-widest uppercase border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 rounded transition-all duration-150"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> [ BACK_TO_COMMAND_HUB ]
      </Link>

      <div className="max-w-4xl mx-auto space-y-6 flex flex-col items-center relative p-6 sm:p-8 rounded-2xl overflow-hidden border border-cyan-500/20 bg-slate-900/40 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.08)] min-h-[75vh]">
        {/* Background Image with blur and low opacity */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <NextImage
            src={cozyStudyBg}
            alt="Lofi study background"
            fill
            className="object-cover opacity-[0.06] saturate-50"
          />
          {/* Dark space overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/95 to-slate-900/90 backdrop-blur-[1px]" />
        </div>

        {/* Title */}
        <div className="w-full flex items-center gap-3 self-start z-10">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            <Clock className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">CHRONO_FOCUS</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Tập trung học tập với đồng hồ Pomodoro và âm thanh mô phỏng</p>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 z-10">
          {/* Left column: Custom settings & Ambient sounds */}
          <div className="space-y-6">
            {/* Custom timer options */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                SETUP_TIMER
              </h3>

              <div className="space-y-3">
                <label className="block text-[10px] font-mono text-slate-500 uppercase">Thời lượng (Phút)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[15, 25, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setFocusLength(mins);
                        if (mode === 'focus') setTimeLeft(mins * 60);
                      }}
                      className={cn(
                        "text-[10px] py-1.5 rounded font-mono transition-all border",
                        focusLength === mins
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ambient relaxation sounds */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Music className="h-4 w-4 text-cyan-400" />
                SOUND_SHUNTS
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'Tắt âm', icon: VolumeX },
                  { id: 'rain', label: 'Tiếng mưa', icon: CloudRain },
                  { id: 'waves', label: 'Sóng biển', icon: Waves },
                  { id: 'forest', label: 'Gió rừng', icon: Trees },
                ].map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => setAmbientSound(sound.id as 'none' | 'rain' | 'waves' | 'forest')}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1.5 font-mono text-[9px] uppercase",
                      ambientSound === sound.id
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                        : "bg-slate-900/20 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <sound.icon className="h-4 w-4 text-cyan-400" />
                    <span>{sound.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Music Station links and embedded clips */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Headphones className="h-4 w-4 text-cyan-400" />
                  MUSIC_STATION
                </h3>
                {importedTracks.length > 0 && (
                  <button
                    onClick={() => playPlaylist(importedTracks)}
                    className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 font-bold hover:underline uppercase"
                  >
                    Phát tất cả ({importedTracks.length})
                  </button>
                )}
              </div>

              {/* Link to external music page */}
              <Link
                href="/music"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-[9px] font-mono text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-2.5 rounded-lg transition-all duration-150 w-full"
                title="Đến trạm phát nhạc chính của MyELTS để đăng bài nhạc mới hoặc quản lý playlist"
              >
                <span className="flex items-center gap-1.5 text-[9px]">
                  <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                  TRẠM PHÁT NHẠC CHÍNH
                </span>
                <span>[ ĐẾN TRẠM 🎧 ]</span>
              </Link>

              {/* Imported clips list */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Nhạc học tập đã nhập
                </div>

                {loadingTracks ? (
                  <div className="text-[9px] text-slate-500 font-mono italic animate-pulse py-2 text-center">
                    Đang quét danh sách bài nhạc...
                  </div>
                ) : importedTracks.length === 0 ? (
                  <div className="text-[9px] text-slate-500 font-mono py-4 text-center border border-dashed border-slate-800/80 rounded-lg">
                    Chưa có nhạc nào được nhập.
                    <Link href="/music" target="_blank" className="text-cyan-400 hover:underline block mt-1">
                      Nhấp vào đây để thêm
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {importedTracks.map((track) => {
                      const isCurrent = currentTrack?.id === track.id;
                      const isPlayingNow = isCurrent && isPlaying;
                      return (
                        <button
                          key={track.id}
                          onClick={() => play(track)}
                          className={cn(
                            "w-full flex items-center justify-between text-left p-2 rounded-lg border transition-all text-xs font-mono group",
                            isCurrent
                              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                              : "bg-slate-900/40 border-slate-800/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            {track.thumbnail ? (
                              <div className="h-7 w-7 rounded overflow-hidden flex-shrink-0 relative">
                                <img
                                  src={track.thumbnail}
                                  alt={track.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded bg-slate-800 flex-shrink-0 flex items-center justify-center">
                                <Music className="h-3.5 w-3.5 text-cyan-500/70" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[10px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                                {track.title}
                              </p>
                              {track.artist && (
                                <p className="truncate text-[8px] text-slate-500 mt-0.5">
                                  {track.artist}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {isPlayingNow ? (
                              <div className="flex items-end gap-[2px] h-3.5 w-3.5">
                                <span className="inline-block w-[2px] animate-bounce rounded-full bg-cyan-400" style={{ height: '8px', animationDelay: '0ms', animationDuration: '0.6s' }} />
                                <span className="inline-block w-[2px] animate-bounce rounded-full bg-cyan-400" style={{ height: '14px', animationDelay: '150ms', animationDuration: '0.5s' }} />
                                <span className="inline-block w-[2px] animate-bounce rounded-full bg-cyan-400" style={{ height: '6px', animationDelay: '300ms', animationDuration: '0.7s' }} />
                              </div>
                            ) : (
                              <Play className={cn(
                                "h-3.5 w-3.5 transition-colors",
                                isCurrent ? "text-cyan-400" : "text-slate-600 group-hover:text-cyan-400"
                              )} fill={isCurrent ? "currentColor" : "none"} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center column: Main Circular Timer */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-md flex flex-col items-center justify-between md:col-span-2 relative overflow-hidden">
            {/* Mode Tabs */}
            <div className="z-10 flex justify-between items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800 w-full max-w-sm">
              {[
                { id: 'focus', label: 'TẬP TRUNG' },
                { id: 'shortBreak', label: 'NGHỈ NGẮN' },
                { id: 'longBreak', label: 'NGHỈ DÀI' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id as 'focus' | 'shortBreak' | 'longBreak')}
                  className={cn(
                    "flex-1 text-[9px] font-mono py-1.5 rounded transition-all font-bold tracking-wider",
                    mode === t.id
                      ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Circular Countdown */}
            <div className="z-10 relative flex items-center justify-center my-6">
              <svg className="w-56 h-56 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="112"
                  cy="112"
                  r={radius}
                  stroke="#1e293b"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress circle */}
                <circle
                  cx="112"
                  cy="112"
                  r={radius}
                  stroke="url(#cyanGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Time Display */}
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold font-mono tracking-tight text-slate-100">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[8px] font-mono mt-1 uppercase tracking-widest text-cyan-400 font-bold">
                  {mode === 'focus' ? '🎯 SYS_FOCUS' : '☕ SYS_REST'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="z-10 flex justify-center items-center gap-4 w-full">
              <Button
                size="icon"
                variant="outline"
                className="rounded-lg h-9 w-9 border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 shadow-sm"
                onClick={resetTimer}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                size="lg"
                onClick={toggleTimer}
                className="rounded-lg px-8 h-10 bg-cyan-500 hover:bg-cyan-600 text-slate-950 shadow-md border-none transition-all duration-300 font-mono font-bold text-xs"
              >
                {isRunning ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
                {isRunning ? 'TẠM DỪNG' : 'BẮT ĐẦU'}
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="rounded-lg h-9 w-9 border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 shadow-sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>

            {/* Task Linker */}
            {mode === 'focus' && (
              <div className="z-10 w-full max-w-sm mt-6 pt-4 border-t border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
                  <span>Liên kết nhiệm vụ</span>
                  <button
                    className="hover:underline text-cyan-400 font-bold"
                    onClick={() => void fetchTasks()}
                  >
                    Tải lại
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between text-left text-xs bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg text-slate-200 font-mono focus:outline-none transition-all"
                  >
                    <span className="truncate pr-4">
                      {selectedTask
                        ? `${selectedTask.dailyPlan.deepPlan.title} // ${selectedTask.title}`
                        : '-- Chọn nhiệm vụ --'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                      {tasks.length === 0 ? (
                        <div className="p-3 text-[10px] font-mono text-slate-500 text-center uppercase">
                          [ NO PENDING TASKS IN QUEUE ]
                        </div>
                      ) : (
                        tasks.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedTaskId(t.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2.5 text-[10px] font-mono hover:bg-slate-900 border-b border-slate-900 last:border-0 block truncate ${
                              t.id === selectedTaskId ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <span className="block font-bold text-[8px] text-cyan-500/70 uppercase">
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-1 text-[9px] font-mono">
                    <span className="text-slate-500">
                      Tích lũy: <span className="font-bold text-cyan-400">{selectedTask.actualMinutes || 0}</span> / {selectedTask.estimatedMinutes}m
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      onClick={handleMarkComplete}
                      className="h-6 px-2 text-[9px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 rounded border border-emerald-500/10 flex items-center gap-1 font-bold font-mono"
                    >
                      <CheckCircle className="h-3 w-3" />
                      COMPLETE
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
