export const TUTOR_TYPES = [
  'WRITING_TASK1',
  'WRITING_TASK2',
  'LISTENING',
  'SPEAKING',
  'READING_ACADEMIC',
  'READING_GENERAL',
] as const;

export type TutorType = (typeof TUTOR_TYPES)[number];

export const MESSAGE_ROLES = ['USER', 'ASSISTANT', 'SYSTEM'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const MESSAGE_CONTENT_TYPES = [
  'TEXT',
  'AUDIO',
  'IMAGE',
  'ESSAY_EVALUATION',
  'LISTENING_EXERCISE',
  'READING_PASSAGE',
  'SPEAKING_FEEDBACK',
] as const;

export type MessageContentType = (typeof MESSAGE_CONTENT_TYPES)[number];

export const DEFAULT_CHAT_CONTEXT_LIMIT = 20;

export type ChatSessionItem = {
  id: string;
  title: string | null;
  tutorType: TutorType;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessagePreview?: string;
};

export type ChatMessageItem = {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  contentType: MessageContentType;
  metadata: Record<string, unknown> | null;
  audioUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export function isTutorType(value: unknown): value is TutorType {
  return typeof value === 'string' && TUTOR_TYPES.includes(value as TutorType);
}

export function isMessageContentType(value: unknown): value is MessageContentType {
  return typeof value === 'string' && MESSAGE_CONTENT_TYPES.includes(value as MessageContentType);
}

export function buildSessionTitleFromMessage(content: string): string {
  const compact = content.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  if (!compact) {
    return 'New AI Chat';
  }

  const plain = compact
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[\[\]()*_~#>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) {
    return 'New AI Chat';
  }

  const firstChunk = plain.split(/[.!?;:]/)[0]?.trim() || plain;
  const words = firstChunk.split(' ').filter(Boolean).slice(0, 7);
  const compactTitle = words.join(' ');
  const boundedTitle = compactTitle.length > 36 ? compactTitle.slice(0, 36).trim() : compactTitle;

  if (!boundedTitle) {
    return 'New AI Chat';
  }

  return boundedTitle;
}

export function groupSessionsByDate(sessions: ChatSessionItem[]): Record<string, ChatSessionItem[]> {
  const grouped: Record<string, ChatSessionItem[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  for (const session of sessions) {
    const updated = new Date(session.updatedAt).getTime();

    if (updated >= todayStart) {
      grouped.Today.push(session);
      continue;
    }

    if (updated >= yesterdayStart) {
      grouped.Yesterday.push(session);
      continue;
    }

    if (updated >= weekStart) {
      grouped['This Week'].push(session);
      continue;
    }

    grouped.Older.push(session);
  }

  return grouped;
}

export function formatChatTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function sanitizeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyInlineMarkdown(line: string): string {
  return line
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function parseTable(lines: string[]): string | null {
  if (lines.length < 2) {
    return null;
  }

  if (!lines[1].includes('---')) {
    return null;
  }

  const normalizeCells = (line: string) =>
    line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell, index, arr) => !(index === 0 && cell === '') && !(index === arr.length - 1 && cell === ''));

  const headerCells = normalizeCells(lines[0]);
  if (headerCells.length === 0) {
    return null;
  }

  const rows = lines.slice(2).map((line) => normalizeCells(line));

  const headHtml = `<thead><tr>${headerCells
    .map((cell) => `<th>${applyInlineMarkdown(sanitizeHtml(cell))}</th>`)
    .join('')}</tr></thead>`;

  const bodyHtml = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${headerCells
          .map((_, colIndex) => `<td>${applyInlineMarkdown(sanitizeHtml(row[colIndex] || ''))}</td>`)
          .join('')}</tr>`
    )
    .join('')}</tbody>`;

  return `<div class="chat-markdown-table"><table>${headHtml}${bodyHtml}</table></div>`;
}

export function markdownToSafeHtml(markdown: string): string {
  const escaped = sanitizeHtml(markdown).replace(/\r\n/g, '\n');
  const codeBlocks: string[] = [];

  const masked = escaped.replace(/```([\s\S]*?)```/g, (_match, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `__CODE_BLOCK_${index}__`;
  });

  const blocks = masked.split(/\n\n+/);

  const html = blocks
    .map((rawBlock) => {
      const block = rawBlock.trim();
      if (!block) {
        return '';
      }

      if (/^__CODE_BLOCK_\d+__$/.test(block)) {
        const idx = Number(block.match(/\d+/)?.[0] || 0);
        return codeBlocks[idx] || '';
      }

      const lines = block.split('\n');
      const maybeTable = parseTable(lines);
      if (maybeTable) {
        return maybeTable;
      }

      if (lines.every((line) => line.trim().startsWith('- '))) {
        return `<ul>${lines
          .map((line) => `<li>${applyInlineMarkdown(line.trim().slice(2))}</li>`)
          .join('')}</ul>`;
      }

      if (lines.every((line) => /^\d+\.\s/.test(line.trim()))) {
        return `<ol>${lines
          .map((line) => `<li>${applyInlineMarkdown(line.trim().replace(/^\d+\.\s/, ''))}</li>`)
          .join('')}</ol>`;
      }

      if (block.startsWith('### ')) {
        return `<h3>${applyInlineMarkdown(block.slice(4))}</h3>`;
      }

      if (block.startsWith('## ')) {
        return `<h2>${applyInlineMarkdown(block.slice(3))}</h2>`;
      }

      if (block.startsWith('# ')) {
        return `<h1>${applyInlineMarkdown(block.slice(2))}</h1>`;
      }

      return `<p>${applyInlineMarkdown(block).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');

  return html.replace(/__CODE_BLOCK_(\d+)__/g, (_match, idx) => codeBlocks[Number(idx)] || '');
}

export type SSEHandler = {
  onDelta?: (delta: string) => void;
  onDone?: (payload: Record<string, unknown>) => void;
};

export async function consumeEventStream(
  stream: ReadableStream<Uint8Array>,
  handler: SSEHandler
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let delimiterIndex = buffer.indexOf('\n\n');
    while (delimiterIndex !== -1) {
      const eventChunk = buffer.slice(0, delimiterIndex);
      buffer = buffer.slice(delimiterIndex + 2);

      const lines = eventChunk.split('\n');
      let eventName = 'message';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventName = line.replace('event:', '').trim();
        }

        if (line.startsWith('data:')) {
          data += line.replace('data:', '').trim();
        }
      }

      if (eventName === 'delta') {
        try {
          const parsed = JSON.parse(data) as { delta?: string };
          if (typeof parsed.delta === 'string' && handler.onDelta) {
            handler.onDelta(parsed.delta);
          }
        } catch {
          // Ignore invalid delta payload.
        }
      }

      if (eventName === 'done') {
        try {
          const parsed = JSON.parse(data) as Record<string, unknown>;
          handler.onDone?.(parsed);
        } catch {
          handler.onDone?.({});
        }
      }

      delimiterIndex = buffer.indexOf('\n\n');
    }
  }
}
