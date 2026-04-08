import { cn } from '@/lib/utils';

type FormulaRow = {
  label: string;
  pattern: string;
  note: string;
};

type GrammarFormulaTableProps = {
  structurePattern?: string | null;
  className?: string;
};

function splitFormulaSegments(input: string): string[] {
  return input
    .split(/\||\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isQuestionPattern(normalized: string): boolean {
  return (
    normalized.includes('?') ||
    /^(do|does|did|am|is|are|was|were|have|has|had|will|would|shall|should|can|could|may|might|must)\b/.test(
      normalized
    )
  );
}

function isNegativePattern(normalized: string): boolean {
  return /\bnot\b/.test(normalized) || normalized.includes("n't");
}

function extractExplicitLabel(segment: string): { label: 'Khẳng định' | 'Phủ định' | 'Nghi vấn' | null; pattern: string } {
  const separatorIndex = segment.indexOf(':');

  if (separatorIndex <= 0) {
    return {
      label: null,
      pattern: segment.trim(),
    };
  }

  const prefix = segment.slice(0, separatorIndex).trim();
  const content = segment.slice(separatorIndex + 1).trim();

  if (!content) {
    return {
      label: null,
      pattern: segment.trim(),
    };
  }

  const normalizedPrefix = normalizeForMatch(prefix);

  if (normalizedPrefix.includes('khang dinh') || normalizedPrefix.includes('affirmative')) {
    return {
      label: 'Khẳng định',
      pattern: content,
    };
  }

  if (normalizedPrefix.includes('phu dinh') || normalizedPrefix.includes('negative')) {
    return {
      label: 'Phủ định',
      pattern: content,
    };
  }

  if (
    normalizedPrefix.includes('nghi van') ||
    normalizedPrefix.includes('interrogative') ||
    normalizedPrefix.includes('question')
  ) {
    return {
      label: 'Nghi vấn',
      pattern: content,
    };
  }

  return {
    label: null,
    pattern: segment.trim(),
  };
}

function inferFormulaLabel(pattern: string, index: number, explicitLabel: 'Khẳng định' | 'Phủ định' | 'Nghi vấn' | null): string {
  if (explicitLabel) {
    return explicitLabel;
  }

  const normalized = normalizeForMatch(pattern);

  if (isQuestionPattern(normalized)) {
    return 'Nghi vấn';
  }

  if (isNegativePattern(normalized)) {
    return 'Phủ định';
  }

  if (index === 0) {
    return 'Khẳng định';
  }

  return `Mẫu ${index + 1}`;
}

function inferFormulaNote(pattern: string, explicitLabel: 'Khẳng định' | 'Phủ định' | 'Nghi vấn' | null): string {
  const normalized = normalizeForMatch(pattern);

  if (explicitLabel === 'Nghi vấn' || isQuestionPattern(normalized)) {
    return 'Dùng để đặt câu hỏi hoặc xác nhận thông tin.';
  }

  if (explicitLabel === 'Phủ định' || isNegativePattern(normalized)) {
    return 'Dùng để phủ định ý chính trong câu.';
  }

  if (explicitLabel === 'Khẳng định') {
    return 'Dùng để trình bày thông tin ở dạng khẳng định.';
  }

  if (normalized.includes('if ')) {
    return 'Dùng khi mô tả điều kiện hoặc giả định.';
  }

  if (normalized.includes('have') || normalized.includes('has')) {
    return 'Nhấn mạnh kết quả, trải nghiệm hoặc thời lượng liên hệ hiện tại.';
  }

  if (normalized.includes('will') || normalized.includes('going to')) {
    return 'Dùng để nói kế hoạch hoặc dự đoán trong tương lai.';
  }

  return 'Dùng cho mẫu câu cơ bản của chủ điểm ngữ pháp này.';
}

function parseFormulaRows(structurePattern?: string | null): FormulaRow[] {
  if (!structurePattern?.trim()) {
    return [];
  }

  const segments = splitFormulaSegments(structurePattern);

  return segments.map((segment, index) => {
    const parsed = extractExplicitLabel(segment);

    return {
      label: inferFormulaLabel(parsed.pattern, index, parsed.label),
      pattern: parsed.pattern,
      note: inferFormulaNote(parsed.pattern, parsed.label),
    };
  });
}

export function GrammarFormulaTable({ structurePattern, className }: GrammarFormulaTableProps) {
  const rows = parseFormulaRows(structurePattern);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-primary/30 bg-white shadow-sm', className)}>
      <table className="w-full table-auto border-collapse text-left text-sm">
        <thead className="bg-primary/10 text-primary-dark">
          <tr>
            <th className="w-28 border-b border-primary/20 px-3 py-2 font-semibold">Dạng</th>
            <th className="border-b border-primary/20 px-3 py-2 font-semibold">Công thức</th>
            <th className="border-b border-primary/20 px-3 py-2 font-semibold">Gợi ý dùng nhanh</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.label}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-secondary/25'}>
              <td className="border-b border-primary/10 px-3 py-2 align-top font-medium text-text-main">{row.label}</td>
              <td className="border-b border-primary/10 px-3 py-2 align-top font-mono text-xs text-text-main">{row.pattern}</td>
              <td className="border-b border-primary/10 px-3 py-2 align-top text-xs text-text-muted">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
