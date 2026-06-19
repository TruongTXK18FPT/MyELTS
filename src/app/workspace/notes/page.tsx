'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  NotebookPen,
  Plus,
  Pin,
  Search,
  Calendar,
  Tag,
  Loader2,
  FileText,
  LayoutGrid,
  List,
  ChevronLeft,
} from 'lucide-react';

type NoteData = {
  id: string;
  title: string;
  plainText: string | null;
  tags: string[];
  isPinned: boolean;
  date: string;
  updatedAt: string;
};

export default function NotesPage() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/deep-workspace/notes');
      if (res.ok) setNotes(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) void fetchNotes();
  }, [session, fetchNotes]);

  const createNewNote = async () => {
    try {
      const res = await fetch('/api/deep-workspace/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Ghi chú mới',
          content: { blocks: [{ id: '1', type: 'paragraph', content: '' }] },
          plainText: '',
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (res.ok) {
        const note = await res.json();
        window.location.href = `/workspace/notes/${note.id}`;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePin = async (noteId: string, currentPinned: boolean) => {
    try {
      await fetch(`/api/deep-workspace/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinned }),
      });
      void fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.plainText || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

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
        {/* Decorative corner grid marks */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-500/30" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-500/30" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-500/30" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-500/30" />

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            <NotebookPen className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">KNOWLEDGE_VAULT</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
              {notes.length} Active Intel Notes • Synaptic Embedding Online
            </p>
          </div>
        </div>

        <Button
          onClick={createNewNote}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-mono text-xs font-bold px-4 py-2 border-none rounded-lg self-start sm:self-auto shadow-lg shadow-cyan-500/10"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          INITIALISE_NEW_NOTE
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm tri thức trong notes..."
            className="w-full rounded-lg border border-slate-800 pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500/50 bg-slate-950/60 text-slate-200"
          />
        </div>

        <div className="flex rounded-lg border border-slate-800 overflow-hidden bg-slate-950/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={cn('rounded-none h-9 text-xs font-mono', viewMode === 'grid' ? 'bg-cyan-500/10 text-cyan-400 font-bold border-r border-slate-800' : 'text-slate-500 border-r border-slate-800')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn('rounded-none h-9 text-xs font-mono', viewMode === 'list' ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'text-slate-500')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notes Grid/List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 rounded-xl border border-slate-800/80 p-6 flex flex-col items-center">
          <FileText className="h-10 w-10 text-slate-700 mb-4" />
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            {search ? '[ NO VAULT MATCHES FOUND ]' : '[ INTEL STORAGE EMPTY ]'}
          </p>
          {!search && (
            <Button onClick={createNewNote} className="mt-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-mono">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              CREATE_FIRST_NOTE
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-2'
        )}>
          {filteredNotes.map(note => (
            <Link
              key={note.id}
              href={`/workspace/notes/${note.id}`}
              className={cn(
                'group block rounded-xl border border-slate-800/60 bg-slate-900/40 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300 p-4 relative',
                viewMode === 'grid' ? '' : 'flex items-center gap-4 py-3'
              )}
            >
              {/* Node decoration lines */}
              <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-slate-700 opacity-40" />
              <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-slate-700 opacity-40" />

              <div className={cn('flex-1 min-w-0', viewMode === 'list' ? '' : 'space-y-2')}>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-200 text-xs font-mono truncate group-hover:text-cyan-400 transition-colors">
                    {note.title}
                  </h3>
                  <button
                    onClick={e => { e.preventDefault(); void togglePin(note.id, note.isPinned); }}
                    className={cn(
                      'flex-shrink-0 ml-2 transition-colors',
                      note.isPinned ? 'text-cyan-400' : 'text-transparent group-hover:text-slate-600'
                    )}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                </div>

                {viewMode === 'grid' && note.plainText && (
                  <p className="text-[10px] text-slate-400 font-mono line-clamp-3 leading-relaxed">
                    {note.plainText.slice(0, 150)}
                  </p>
                )}

                <div className={cn(
                  'flex items-center gap-3 text-[9px] font-mono text-slate-500',
                  viewMode === 'grid' ? 'mt-3' : ''
                )}>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-cyan-500/70" />
                    {new Date(note.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                  </span>

                  {note.tags.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Tag className="h-3.5 w-3.5 text-cyan-500/70" />
                      {note.tags.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
