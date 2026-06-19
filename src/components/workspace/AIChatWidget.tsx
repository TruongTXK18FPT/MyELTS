'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Mình là AI Companion đồng hành cùng bạn. Bạn có câu hỏi nào về các ghi chú hoặc kế hoạch học tập hiện tại không?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/deep-workspace/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant' as const, content: data.reply }]);
      } else {
        throw new Error('Lỗi từ máy chủ');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant' as const, content: 'Xin lỗi bạn, đã có lỗi kết nối xảy ra. Bạn vui lòng thử lại nhé!' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Cuộc hội thoại đã được làm mới. Mình có thể giúp gì thêm cho lộ trình học của bạn?',
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[400px] h-[500px] rounded-2xl border border-pink-100 bg-white shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
              <div>
                <h3 className="font-bold text-sm">AI Companion</h3>
                <p className="text-[10px] text-pink-100 font-medium">Trợ lý đồng hành học tập</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                title="Làm mới hội thoại"
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-pink-50/5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm transition-all',
                  m.role === 'user'
                    ? 'bg-pink-500 text-white rounded-tr-none ml-auto'
                    : 'bg-slate-50 text-text-main border border-slate-100 rounded-tl-none mr-auto'
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground mr-auto bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-3 py-2 text-xs shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin text-pink-500" />
                <span>AI đang suy nghĩ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t border-pink-50 bg-white flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi AI về ghi chú hoặc kế hoạch..."
              className="flex-1 rounded-xl border border-pink-100/60 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-200 text-text-main bg-white"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-8 w-8 rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-sm border-none flex-shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Toggle Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white flex items-center justify-center shadow-lg shadow-pink-200 hover:scale-105 transition-all duration-300 border-none group cursor-pointer focus:outline-none"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-pink-500 animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
