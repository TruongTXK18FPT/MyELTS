'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ReadingPassageCardProps = {
  content: string;
  metadata: Record<string, unknown> | null;
};

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeKeywords(metadata: Record<string, unknown> | null): string[] {
  if (!Array.isArray(metadata?.keywords)) {
    return [];
  }

  return (metadata.keywords as unknown[])
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 12);
}

function normalizeVocabulary(metadata: Record<string, unknown> | null): Record<string, string> {
  const raw = metadata?.vocabulary;
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const entries = Object.entries(raw as Record<string, unknown>)
    .filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string')
    .slice(0, 20);

  return Object.fromEntries(entries);
}

export function ReadingPassageCard({ content, metadata }: ReadingPassageCardProps) {
  const keywords = useMemo(() => normalizeKeywords(metadata), [metadata]);
  const vocabulary = useMemo(() => normalizeVocabulary(metadata), [metadata]);
  const vocabularyEntries = useMemo(() => Object.entries(vocabulary), [vocabulary]);

  const keywordPattern = useMemo(() => {
    if (keywords.length === 0) {
      return null;
    }

    return new RegExp(`(${keywords.map((keyword) => escapeRegex(keyword)).join('|')})`, 'gi');
  }, [keywords]);

  const highlightedPreview = useMemo(() => {
    if (!keywordPattern) {
      return null;
    }

    const plain = content.replace(/[#*_`>|\-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) {
      return null;
    }

    const sample = plain.slice(0, 220);
    return sample.replace(keywordPattern, '[$1]');
  }, [content, keywordPattern]);

  return (
    <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-blue-600 text-white">Reading Passage</Badge>
        {keywords.slice(0, 6).map((keyword) => (
          <Badge key={keyword} variant="secondary" className="bg-blue-100 text-blue-700">
            {keyword}
          </Badge>
        ))}
      </div>

      {highlightedPreview ? (
        <div className="rounded-lg border border-blue-100 bg-white/70 px-3 py-2 text-xs text-blue-700">
          <span className="font-semibold">Keyword preview:</span> {highlightedPreview}
        </div>
      ) : null}

      <div className="max-h-96 overflow-y-auto rounded-xl bg-white/80 p-3 text-sm leading-7 text-slate-800">
        <div className="chat-markdown text-slate-800">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-blue-700 underline decoration-1 underline-offset-2 hover:text-blue-800"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="chat-markdown-table">
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {vocabularyEntries.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">Vocabulary Notes</p>
          <div className="flex flex-wrap gap-2">
            {vocabularyEntries.slice(0, 16).map(([word, meaning]) => (
              <Popover key={word}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                  >
                    {word}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs text-sm">
                  <p className="font-semibold text-blue-700">{word}</p>
                  <p className="mt-1 text-muted-foreground">{meaning}</p>
                </PopoverContent>
              </Popover>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
