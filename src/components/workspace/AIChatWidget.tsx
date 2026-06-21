'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, MessageSquare, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all font-mono"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400 animate-in fade-in zoom-in duration-150" />
          <span className="text-emerald-400 font-semibold text-[10px]">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 text-slate-400" />
          <span className="text-[10px]">Copy</span>
        </>
      )}
    </button>
  );
}

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
        <div className="w-[380px] sm:w-[400px] h-[500px] rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-4 text-slate-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm">AI Companion</h3>
                <p className="text-[10px] text-slate-400 font-mono">Trợ lý đồng hành học tập</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                title="Làm mới hội thoại"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 p-1.5 rounded-lg transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 p-1.5 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm transition-all',
                  m.role === 'user'
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 rounded-tr-none ml-auto'
                    : 'bg-slate-900/60 text-slate-200 border border-slate-800/80 rounded-tl-none mr-auto'
                )}
              >
                <div className={cn(
                  'chat-markdown w-full break-words',
                  m.role === 'user' ? 'text-cyan-200' : 'text-slate-200'
                )}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-semibold text-cyan-400 hover:text-cyan-300 underline decoration-1 underline-offset-2 transition-colors"
                        >
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-cyan-500 bg-slate-950/60 pl-3 py-1 my-2 rounded-r-lg italic text-cyan-100 font-sans">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5 font-sans">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5 font-sans">{children}</ol>,
                      table: ({ children }) => (
                        <div className="chat-markdown-table border border-slate-800 bg-slate-950/70 my-2 overflow-x-auto rounded-xl w-full">
                          <table className="min-w-full divide-y divide-slate-800">{children}</table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="bg-slate-900 px-3 py-1.5 text-left text-xs font-bold text-cyan-400 border-b border-slate-800 font-mono">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-3 py-1.5 text-slate-350 border-b border-slate-900/50 text-xs">
                          {children}
                        </td>
                      ),
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && !String(children).includes('\n');
                        
                        if (isInline) {
                          return (
                            <code
                              className={cn(
                                'rounded px-1.5 py-0.5 font-mono text-[11px]',
                                m.role === 'user' 
                                  ? 'bg-cyan-500/20 text-cyan-100' 
                                  : 'bg-slate-800 text-cyan-300'
                              )}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        }
                        
                        return (
                          <div className="my-2.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-md font-sans w-full">
                            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-1 font-mono text-[9px] text-slate-400">
                              <span className="font-semibold uppercase tracking-wider text-cyan-400">
                                {match ? match[1] : 'code'}
                              </span>
                              <CopyButton text={String(children).replace(/\n$/, '')} />
                            </div>
                            <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                              <code>{children}</code>
                            </pre>
                          </div>
                        );
                      }
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 mr-auto bg-slate-900/60 border border-slate-800/80 rounded-2xl rounded-tl-none px-3 py-2 text-xs shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                <span>AI đang suy nghĩ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi AI về ghi chú hoặc kế hoạch..."
              className="flex-1 rounded-xl border border-slate-800 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-slate-100 bg-slate-900 placeholder-slate-500"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-8 w-8 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 shadow-sm border-none flex-shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Toggle Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-slate-900 hover:bg-slate-800 text-cyan-400 flex items-center justify-center border border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 transition-all duration-300 group cursor-pointer focus:outline-none"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-cyan-400" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );

}
