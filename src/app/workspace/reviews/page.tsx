'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  BookOpen,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ReviewItem = {
  id: string;
  title: string;
  box: number;
  intervalDays: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  noteId: string | null;
  note?: {
    title: string;
    plainText: string | null;
    tags: string[];
  };
};

export default function ReviewsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deep-workspace/reviews');
      if (res.ok) {
        const data = await res.json();
        setDueItems(data.due || []);
        setUpcomingItems(data.upcoming || []);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Lỗi', description: 'Không thể tải hàng đợi ôn tập.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      void fetchReviews();
    }
  }, [fetchReviews]);

  const handleRate = async (rating: 'easy' | 'medium' | 'hard') => {
    if (dueItems.length === 0 || submitting) return;
    const item = dueItems[currentIndex];
    setSubmitting(true);

    try {
      const res = await fetch(`/api/deep-workspace/reviews/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (res.ok) {
        toast({
          title: rating === 'easy' ? 'Đã nhớ tốt! 🟢' : rating === 'medium' ? 'Tạm ổn! 🟡' : 'Cần ôn lại! 🔴',
          description: rating === 'easy' ? 'Đã tăng khoảng cách ôn tập.' : rating === 'medium' ? 'Giữ nguyên khoảng cách.' : 'Thẻ sẽ xuất hiện lại vào ngày mai.',
        });
        
        setIsFlipped(false);
        setTimeout(() => {
          setDueItems((prev) => prev.filter((_, idx) => idx !== currentIndex));
          setSubmitting(false);
        }, 300);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, isDue: boolean) => {
    if (!confirm('Xóa mục ôn tập này?')) return;
    try {
      const res = await fetch(`/api/deep-workspace/reviews/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast({ description: 'Đã xóa khỏi hàng đợi ôn tập.' });
        if (isDue) {
          setDueItems((prev) => prev.filter((item) => item.id !== id));
        } else {
          setUpcomingItems((prev) => prev.filter((item) => item.id !== id));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const currentItem = dueItems[currentIndex];

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
            <Brain className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">SYNAPSE_RECALL</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
              Spaced Repetition Algorithm Active • Box Leitner Memory Shunt
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchReviews()}
          className="border-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 h-9 font-mono text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          REBOOT_QUEUE
        </Button>
      </div>

      {/* Due Session */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flashcard Area */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold font-mono tracking-widest text-slate-300 flex items-center gap-2 uppercase">
            🎯 DUE_TODAY_QUEUE ({dueItems.length} items)
          </h2>

          {dueItems.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-12 text-center backdrop-blur">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-bold text-sm font-mono text-slate-200 uppercase tracking-widest">Core Synchronized</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Bạn đã hoàn thành tất cả các mục cần ôn tập của ngày hôm nay.
              </p>
            </div>
          ) : (
            currentItem && (
              <div className="space-y-6">
                {/* Flashcard container */}
                <div 
                  className={cn(
                    "w-full h-80 rounded-xl border border-slate-800 bg-slate-950/60 relative cursor-pointer shadow-md select-none transition-all duration-500 preserve-3d",
                    isFlipped ? "rotate-y-180" : ""
                  )}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* Card Front */}
                  <div className="absolute inset-0 backface-hidden p-6 flex flex-col justify-between rounded-xl">
                    <div className="flex justify-between items-center text-[9px] uppercase font-mono font-bold text-cyan-400">
                      <span>BIOMETRIC_RECALL // BOX {currentItem.box}</span>
                      <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">FLIP_TO_VIEW</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                      <h3 className="text-lg font-bold text-slate-100 font-mono leading-snug">{currentItem.title}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-3 flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-slate-600" /> Bấm vào thẻ để lật xem nội dung giải nghĩa
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600 justify-center">
                      <Calendar className="h-3.5 w-3.5" />
                      Lần ôn gần nhất: {currentItem.lastReviewedAt ? new Date(currentItem.lastReviewedAt).toLocaleDateString('vi-VN') : 'Chưa có'}
                    </div>
                  </div>

                  {/* Card Back */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 p-6 flex flex-col justify-between rounded-xl bg-slate-900/90 overflow-hidden">
                    <div className="flex justify-between items-center text-[9px] uppercase font-mono font-bold text-cyan-400 border-b border-slate-800 pb-2">
                      <span>KNOWLEDGE_PAYLOAD</span>
                      <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">DECRYPTED</span>
                    </div>

                    <div className="flex-1 overflow-y-auto my-3 pr-1 text-left font-mono">
                      {currentItem.note?.plainText ? (
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {currentItem.note.plainText}
                        </p>
                      ) : (
                        <p className="text-[10px] italic text-slate-600 text-center pt-10">
                          Thẻ tự tạo hoặc ghi chú chưa có nội dung text.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-2" onClick={(e) => e.stopPropagation()}>
                      {currentItem.noteId && (
                        <Link href={`/workspace/notes/${currentItem.noteId}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-6 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/5 flex items-center gap-1 p-1">
                            <ExternalLink className="h-3 w-3" /> OPEN_ORIGIN_NOTE
                          </Button>
                        </Link>
                      )}
                      <span className="text-[9px] font-mono text-slate-600">Bấm thẻ để lật lại</span>
                    </div>
                  </div>
                </div>

                {/* Rating Controls (Only show when flipped) */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    disabled={submitting}
                    onClick={() => void handleRate('hard')}
                    className="flex-1 max-w-[120px] rounded-lg bg-red-600/80 hover:bg-red-700 text-white font-mono text-[10px] py-2 h-auto"
                  >
                    KHÓ (1 ngày)
                  </Button>
                  <Button
                    disabled={submitting}
                    onClick={() => void handleRate('medium')}
                    className="flex-1 max-w-[120px] rounded-lg bg-amber-600/80 hover:bg-amber-700 text-white font-mono text-[10px] py-2 h-auto"
                  >
                    TẠM ỔN
                  </Button>
                  <Button
                    disabled={submitting}
                    onClick={() => void handleRate('easy')}
                    className="flex-1 max-w-[120px] rounded-lg bg-emerald-600/80 hover:bg-emerald-700 text-white font-mono text-[10px] py-2 h-auto"
                  >
                    DỄ ({currentItem.box === 5 ? 30 : currentItem.box === 4 ? 30 : currentItem.box === 3 ? 14 : currentItem.box === 2 ? 7 : 3} ngày)
                  </Button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Spaced List (Upcoming / All Queue) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold font-mono tracking-widest text-slate-300 flex items-center gap-2 uppercase">
            📅 UPCOMING_QUEUE ({upcomingItems.length} items)
          </h2>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm space-y-3 max-h-[420px] overflow-y-auto">
            {upcomingItems.length === 0 ? (
              <div className="text-center py-10 font-mono">
                <Calendar className="h-6 w-6 text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">No items in upcoming queue</p>
              </div>
            ) : (
              upcomingItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-900 p-3 bg-slate-900/10 flex items-start justify-between gap-3 hover:border-slate-800 transition-all font-mono">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-500">
                      <span className="rounded bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 border border-cyan-500/20">
                        BOX {item.box}
                      </span>
                      <span>DUE: {new Date(item.nextReviewAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleDelete(item.id, false)}
                    className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-900 rounded transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Global CSS for 3D card flipping */}
      <style jsx global>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
