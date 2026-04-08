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

const defaultLabels = ['Khẳng định', 'Phủ định', 'Nghi vấn', 'Mẫu mở rộng 1', 'Mẫu mở rộng 2'];

function splitFormulaSegments(input: string): string[] {
  return input
    .split(/\||\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function inferFormulaLabel(pattern: string, index: number): string {
  const normalized = pattern.toLowerCase();

  if (normalized.includes('?') || normalized.startsWith('do ') || normalized.startsWith('did ')) {
    return 'Nghi vấn';
  }

  if (normalized.includes(' not ') || normalized.includes("n't")) {
    return 'Phủ định';
  }

  if (defaultLabels[index]) {
    return defaultLabels[index];
  }

  return `Mẫu ${index + 1}`;
}

function inferFormulaNote(pattern: string): string {
  const normalized = pattern.toLowerCase();

  if (normalized.includes('?')) {
    return 'Dùng để đặt câu hỏi hoặc xác nhận thông tin.';
  }

  if (normalized.includes(' not ') || normalized.includes("n't")) {
    return 'Dùng để phủ định ý chính trong câu.';
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

  return segments.map((segment, index) => ({
    label: inferFormulaLabel(segment, index),
    pattern: segment,
    note: inferFormulaNote(segment),
  }));
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
