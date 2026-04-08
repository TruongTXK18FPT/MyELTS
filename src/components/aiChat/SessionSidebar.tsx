'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Trash2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatChatTime, groupSessionsByDate, type ChatSessionItem } from '@/lib/chat-utils';

type SessionSidebarProps = {
  sessions: ChatSessionItem[];
  activeSessionId: string | null;
  isLoading?: boolean;
  onCreateSession: () => void;
  onOpenSession: (sessionId: string) => void;
  onArchiveSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
};

function toCompactTitle(title: string | null): string {
  const text = (title || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return 'New AI Chat';
  }

  const simple = text
    .replace(/[\[\]()*_~#>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!simple) {
    return 'New AI Chat';
  }

  const words = simple.split(' ').filter(Boolean).slice(0, 6);
  const compact = words.join(' ');
  return compact.length > 34 ? compact.slice(0, 34).trim() : compact;
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  isLoading,
  onCreateSession,
  onOpenSession,
  onArchiveSession,
  onDeleteSession,
}: SessionSidebarProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) {
      return sessions;
    }

    return sessions.filter((session) => {
      const title = session.title?.toLowerCase() || '';
      const preview = session.lastMessagePreview?.toLowerCase() || '';
      return title.includes(text) || preview.includes(text);
    });
  }, [query, sessions]);

  const grouped = useMemo(() => groupSessionsByDate(filtered), [filtered]);

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-3xl border border-rose-200/60 bg-white/70 p-3 shadow-xl shadow-rose-200/40 backdrop-blur-md">
      <div className="space-y-2 px-1 pb-2">
        <Button onClick={onCreateSession} className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sessions..."
            className="rounded-xl border-rose-200/70 bg-white/90 pl-9"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 pr-3">
        <div className="space-y-4 pb-4 pr-1">
          {Object.entries(grouped).map(([label, items]) => {
            if (items.length === 0) {
              return null;
            }

            return (
              <section key={label} className="space-y-1.5">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-500">{label}</p>
                <div className="space-y-1">
                  {items.map((session) => {
                    const isActive = activeSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        className={cn(
                          'group mx-auto flex h-[74px] w-[258px] max-w-full items-start gap-2 rounded-xl border px-2 py-2 transition-all sm:items-center',
                          isActive
                            ? 'border-rose-300 bg-rose-50/95 shadow-md shadow-rose-200/60'
                            : 'border-transparent bg-white/55 hover:border-rose-200/80 hover:bg-rose-50/65'
                        )}
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 overflow-hidden text-left"
                          onClick={() => onOpenSession(session.id)}
                        >
                          <p className="truncate text-sm font-medium text-rose-900">{toCompactTitle(session.title)}</p>
                          <p className="truncate text-xs text-rose-700">{session.lastMessagePreview || 'No messages yet'}</p>
                        </button>

                        <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                          <span className="hidden text-[11px] text-rose-400 lg:inline">
                            {formatChatTime(session.updatedAt)}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-rose-500 hover:bg-rose-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              onArchiveSession(session.id);
                            }}
                            aria-label="Archive session"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            aria-label="Delete session"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {!isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-rose-200/70 bg-rose-50/50 p-4 text-center text-sm text-rose-600">
              No sessions yet. Start a new conversation.
            </div>
          )}

          {isLoading && (
            <div className="space-y-2 px-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="mx-auto h-[74px] w-[258px] max-w-full animate-pulse rounded-xl bg-rose-100/70" />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
