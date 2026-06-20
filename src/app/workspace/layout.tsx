'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Calendar,
  NotebookPen,
  BarChart3,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Brain,
  Clock,
  Cpu,
  Terminal,
  User,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { AIChatWidget } from '@/components/workspace/AIChatWidget';
import { useSession } from 'next-auth/react';

const sidebarLinks = [
  { href: '/workspace', label: 'COMMAND_CENTER', icon: BarChart3, index: 'SYS_01', exact: true },
  { href: '/workspace/plans/new', label: 'PLAN_GENERATOR', icon: PlusCircle, index: 'SYS_02' },
  { href: '/workspace/notes', label: 'KNOWLEDGE_VAULT', icon: NotebookPen, index: 'SYS_03' },
  { href: '/workspace/reviews', label: 'SYNAPSE_RECALL', icon: Brain, index: 'SYS_04' },
  { href: '/workspace/pomodoro', label: 'CHRONO_FOCUS', icon: Clock, index: 'SYS_05' },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 relative overflow-hidden">
        {/* Sci-Fi Tech Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35 pointer-events-none z-0" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-cyan-500 animate-spin" />
            <div className="absolute h-10 w-10 rounded-full border-b-2 border-l-2 border-pink-500 animate-spin [animation-duration:1.5s]" />
            <Cpu className="absolute h-5 w-5 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-sm font-mono tracking-widest text-cyan-400 uppercase animate-pulse">
              [ SECURE_LINK: LINKING_SYNAPSES ]
            </h2>
            <p className="text-[10px] font-mono text-slate-500">Connecting biological unit to AI cores...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35 pointer-events-none z-0" />
        <div className="relative z-10 text-center space-y-4 max-w-sm p-6 rounded-2xl border border-red-500/20 bg-slate-900/60 backdrop-blur">
          <Shield className="h-10 w-10 text-red-500 mx-auto animate-bounce" />
          <h2 className="text-sm font-mono text-red-500 font-bold uppercase tracking-wider">
            [ ALERT: ACCESS_DENIED ]
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Authorization signature missing. Redirecting to login portal...
          </p>
          <div className="h-1 bg-red-950 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-1/2 animate-[pulse_1s_infinite]" />
          </div>
          <Button asChild className="w-full mt-4 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl hover:text-red-300">
            <Link href="/auth/login">ĐĂNG NHẬP NGAY</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full bg-slate-950 text-slate-100 font-mono relative overflow-hidden select-none">
      {/* Sci-Fi Tech Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none z-0" />
      {/* Holographic glowing blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-600/10 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Main Core Flex Layout */}
      <div className="flex-1 flex flex-col relative z-10 w-full">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Sci-Fi HUD Bar */}
          <header className="h-[70px] border-b border-slate-800/40 bg-slate-950/40 backdrop-blur-xl px-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase hidden sm:inline">
                  SECURE_DATA_SYNC : OK
                </span>
              </div>
              <div className="h-4 w-[1px] bg-slate-800 hidden sm:inline" />
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Terminal className="h-3.5 w-3.5 text-slate-600" />
                <span>TERMINAL_CLOCK:</span>
                <span className="text-slate-300 font-semibold font-mono">{currentTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {session?.user && (
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right hidden sm:block">
                    <p className="text-slate-300 font-semibold truncate max-w-40">{session.user.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{session.user.role || 'STUDENT'}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                    {session.user.name?.trim().charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Children content wrapper */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full text-slate-100">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Floating AI Companion Chat */}
      <AIChatWidget />
    </div>
  );
}
