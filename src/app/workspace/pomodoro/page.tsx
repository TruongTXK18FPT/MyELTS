'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Volume2,
  VolumeX,
  ChevronDown,
  Sparkles,
  Music,
  Waves,
  CloudRain,
  Trees,
  ChevronLeft,
  Radio,
  Headphones,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';
import cozyStudyBg from '@/assets/cozy_study_lofi.png';
import Link from 'next/link';
import { usePomodoro, type PomodoroMode, type AmbientSoundType, type PomodoroThemeType } from '@/providers/PomodoroContext';
import { useMusic, type MusicTrackData } from '@/providers/MusicContext';

const themes = {
  cozy: {
    name: 'Ấm Áp (Lofi)',
    bgUrl: '', // cozyStudyBg
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500/20',
    accentBg: 'bg-cyan-500/5',
    accentBgHover: 'hover:bg-cyan-500/10',
    accentRing: 'shadow-[0_0_20px_rgba(6,182,212,0.1)]',
    glowFrom: 'from-purple-600/10',
    glowTo: 'to-pink-600/10',
    accentBtn: 'bg-cyan-500 hover:bg-cyan-600 text-slate-950',
    indicatorBg: 'bg-cyan-500/20 border-cyan-400 text-cyan-300',
    colorCode: '#06b6d4'
  },
  cyberpunk: {
    name: 'Cyberpunk (Neon)',
    bgUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/20',
    accentBg: 'bg-emerald-500/5',
    accentBgHover: 'hover:bg-emerald-500/10',
    accentRing: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    glowFrom: 'from-emerald-600/15',
    glowTo: 'to-cyan-600/10',
    accentBtn: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950',
    indicatorBg: 'bg-emerald-500/20 border-emerald-400 text-emerald-300',
    colorCode: '#10b981'
  },
  nature: {
    name: 'Rừng Mưa (Green)',
    bgUrl: 'https://images.unsplash.com/photo-1486016006115-74a41448aea2?q=80&w=1200&auto=format&fit=crop',
    accentText: 'text-green-400',
    accentBorder: 'border-green-500/20',
    accentBg: 'bg-green-500/5',
    accentBgHover: 'hover:bg-green-500/10',
    accentRing: 'shadow-[0_0_20px_rgba(34,197,94,0.1)]',
    glowFrom: 'from-green-600/15',
    glowTo: 'to-emerald-600/10',
    accentBtn: 'bg-green-500 hover:bg-green-600 text-slate-950',
    indicatorBg: 'bg-green-500/20 border-green-400 text-green-300',
    colorCode: '#22c55e'
  },
  space: {
    name: 'Vũ Trụ (Nebula)',
    bgUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200&auto=format&fit=crop',
    accentText: 'text-purple-400',
    accentBorder: 'border-purple-500/20',
    accentBg: 'bg-purple-500/5',
    accentBgHover: 'hover:bg-purple-500/10',
    accentRing: 'shadow-[0_0_20px_rgba(168,85,247,0.1)]',
    glowFrom: 'from-purple-900/15',
    glowTo: 'to-indigo-900/10',
    accentBtn: 'bg-purple-500 hover:bg-purple-600 text-slate-950',
    indicatorBg: 'bg-purple-500/20 border-purple-400 text-purple-300',
    colorCode: '#a855f7'
  },
  ocean: {
    name: 'Sóng Biển (Sandy)',
    bgUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/20',
    accentBg: 'bg-amber-500/5',
    accentBgHover: 'hover:bg-amber-500/10',
    accentRing: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]',
    glowFrom: 'from-amber-600/15',
    glowTo: 'to-rose-600/10',
    accentBtn: 'bg-amber-500 hover:bg-amber-600 text-slate-950',
    indicatorBg: 'bg-amber-500/20 border-amber-400 text-amber-300',
    colorCode: '#f59e0b'
  }
};

export default function PomodoroPage() {
  const { toast } = useToast();

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
    setMode,
    setFocusLength,
    setSelectedTaskId,
    setAmbientSound,
    setSoundEnabled,
    setTheme,
    setIsOpen,
    start,
    pause,
    reset,
    markTaskComplete,
    fetchTasks,
  } = usePomodoro();

  // Music Context state and local track list
  const { play, playPlaylist, currentTrack, isPlaying } = useMusic();
  const [importedTracks, setImportedTracks] = useState<MusicTrackData[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch all imported tracks from database
  useEffect(() => {
    const fetchImportedTracks = async () => {
      try {
        const res = await fetch('/api/music/tracks?limit=100');
        if (res.ok) {
          const data = await res.json();
          setImportedTracks(data.tracks || []);
        }
      } catch (err) {
        console.error('Error fetching tracks inside Pomodoro page:', err);
      } finally {
        setLoadingTracks(false);
      }
    };
    void fetchImportedTracks();
  }, []);

  const selectedTheme = themes[theme] || themes.cozy;

  const handleMinimize = () => {
    setIsOpen(true); // Open the floating widget
    toast({
      title: 'Đã bật tiểu cảnh thu nhỏ 🖥️',
      description: 'Đồng hồ học tập và nhạc vẫn đang chạy ở góc trái màn hình. Bạn có thể tự do chuyển sang trang khác!',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // SVG Circular progress ring calculations
  const totalDuration = mode === 'focus' ? focusLength * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/workspace"
          className="inline-flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 tracking-widest uppercase border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 rounded transition-all duration-150 self-start"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> [ QUAY LẠI TRUNG TÂM ]
        </Link>

        {/* Minimize helper button */}
        <button
          onClick={handleMinimize}
          className="inline-flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 tracking-widest uppercase border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 rounded transition-all duration-150 hover:bg-cyan-500/10 cursor-pointer self-start"
          title="Thu nhỏ đồng hồ lơ lửng ở góc trái để học trên trang khác"
        >
          <Maximize2 className="h-3.5 w-3.5" /> [ THU NHỎ TIỂU CẢNH 🖥️ ]
        </button>
      </div>

      <div className={cn(
        "max-w-4xl mx-auto space-y-6 flex flex-col items-center relative p-6 sm:p-8 rounded-2xl overflow-hidden border bg-slate-900/40 backdrop-blur-md transition-all duration-300 min-h-[75vh]",
        selectedTheme.accentBorder,
        selectedTheme.accentRing
      )}>
        {/* Background Image overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {theme === 'cozy' ? (
            <NextImage
              src={cozyStudyBg}
              alt="Lofi study background"
              fill
              className="object-cover opacity-[0.06] saturate-50"
            />
          ) : (
            <img
              src={selectedTheme.bgUrl}
              alt={selectedTheme.name}
              className="w-full h-full object-cover opacity-[0.06] saturate-50"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/95 to-slate-900/90 backdrop-blur-[1px]" />
        </div>

        {/* Title */}
        <div className="w-full flex items-center gap-3 self-start z-10">
          <div className={cn(
            "h-10 w-10 rounded-lg border flex items-center justify-center transition-all",
            selectedTheme.accentBg,
            selectedTheme.accentBorder
          )}>
            <Clock className={cn("h-5 w-5", selectedTheme.accentText)} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">CHRONO_FOCUS</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Tập trung học tập với đồng hồ Pomodoro và âm thanh mô phỏng</p>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 z-10">
          {/* Left column: Custom settings, Themes & Ambient sounds */}
          <div className="space-y-6">
            {/* Custom timer options */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Sparkles className={cn("h-4 w-4", selectedTheme.accentText)} />
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
                      }}
                      className={cn(
                        "text-[10px] py-1.5 rounded font-mono transition-all border cursor-pointer",
                        focusLength === mins
                          ? selectedTheme.indicatorBg
                          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Themes Selector */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Sparkles className={cn("h-4 w-4", selectedTheme.accentText)} />
                THEME_CHUNTS
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(themes).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key as PomodoroThemeType)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1 font-mono text-[9px] uppercase cursor-pointer",
                      theme === key
                        ? cn("border", t.accentBg, t.accentBorder, t.accentText, "font-bold")
                        : "bg-slate-900/20 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: t.colorCode }} />
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient relaxation sounds */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Music className={cn("h-4 w-4", selectedTheme.accentText)} />
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
                    onClick={() => setAmbientSound(sound.id as AmbientSoundType)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1.5 font-mono text-[9px] uppercase cursor-pointer",
                      ambientSound === sound.id
                        ? cn("border", selectedTheme.accentBg, selectedTheme.accentBorder, selectedTheme.accentText, "font-bold")
                        : "bg-slate-900/20 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <sound.icon className={cn("h-4 w-4", selectedTheme.accentText)} />
                    <span>{sound.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Learning Music Station link */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Headphones className={cn("h-4 w-4", selectedTheme.accentText)} />
                  MUSIC_STATION
                </h3>
                {importedTracks.length > 0 && (
                  <button
                    onClick={() => playPlaylist(importedTracks)}
                    className={cn("text-[9px] font-mono font-bold hover:underline uppercase cursor-pointer", selectedTheme.accentText)}
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
                className={cn(
                  "flex items-center justify-between text-[9px] font-mono border px-3 py-2.5 rounded-lg transition-all duration-150 w-full",
                  selectedTheme.accentBorder,
                  selectedTheme.accentBg,
                  selectedTheme.accentBgHover,
                  selectedTheme.accentText
                )}
                title="Đến trạm phát nhạc chính của MyELTS để đăng bài nhạc mới hoặc quản lý playlist"
              >
                <span className="flex items-center gap-1.5 text-[9px]">
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
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
                            "w-full flex items-center justify-between text-left p-2 rounded-lg border transition-all text-xs font-mono group cursor-pointer",
                            isCurrent
                              ? cn("border text-cyan-300 bg-cyan-500/10 border-cyan-500/30")
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

          {/* Center and right column: Main Circular Timer & controls */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-md flex flex-col items-center justify-between md:col-span-2 relative overflow-hidden">
            {/* Mode selection tabs */}
            <div className="z-10 flex justify-between items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800 w-full max-w-sm">
              {[
                { id: 'focus', label: 'TẬP TRUNG' },
                { id: 'shortBreak', label: 'NGHỈ NGẮN' },
                { id: 'longBreak', label: 'NGHỈ DÀI' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id as PomodoroMode)}
                  className={cn(
                    "flex-1 text-[9px] font-mono py-1.5 rounded transition-all font-bold tracking-wider cursor-pointer",
                    mode === t.id
                      ? cn("border border-opacity-40", selectedTheme.accentBg, selectedTheme.accentBorder, selectedTheme.accentText)
                      : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Circular Countdown Progress Ring */}
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
                  stroke="url(#accentThemeGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="accentThemeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={selectedTheme.colorCode} />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Time digits */}
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold font-mono tracking-tight text-slate-100 animate-pulse">
                  {formatTime(timeLeft)}
                </span>
                <span className={cn("text-[8px] font-mono mt-1 uppercase tracking-widest font-bold", selectedTheme.accentText)}>
                  {mode === 'focus' ? '🎯 SYS_FOCUS' : '☕ SYS_REST'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="z-10 flex justify-center items-center gap-4 w-full">
              <Button
                size="icon"
                variant="outline"
                className="rounded-lg h-9 w-9 border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 shadow-sm"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                size="lg"
                onClick={isRunning ? pause : start}
                className={cn(
                  "rounded-lg px-8 h-10 shadow-md border-none transition-all duration-300 font-mono font-bold text-xs",
                  selectedTheme.accentBtn
                )}
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
                    className={cn("hover:underline font-bold cursor-pointer", selectedTheme.accentText)}
                    onClick={fetchTasks}
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
                      {loadingTasks ? (
                        <div className="p-3 text-[10px] font-mono text-slate-500 text-center uppercase">Đang quét...</div>
                      ) : tasks.length === 0 ? (
                        <div className="p-3 text-[10px] font-mono text-slate-500 text-center uppercase">
                          [ KHÔNG CÓ NHIỆM VỤ ]
                        </div>
                      ) : (
                        tasks.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedTaskId(t.id);
                              setDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left p-2.5 text-[10px] font-mono hover:bg-slate-900 border-b border-slate-900 last:border-0 block truncate cursor-pointer",
                              t.id === selectedTaskId ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'text-slate-400'
                            )}
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
                      Tích lũy: <span className={cn("font-bold", selectedTheme.accentText)}>{selectedTask.actualMinutes || 0}</span> / {selectedTask.estimatedMinutes}m
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markTaskComplete}
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
