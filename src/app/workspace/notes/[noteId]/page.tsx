'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Paintbrush,
  Pin,
  Quote,
  Save,
  Strikethrough,
  Tag,
  Trash2,
  Type,
  Upload,
  Brain,
} from 'lucide-react';
import Link from 'next/link';

type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'divider' | 'image' | 'drawing';

type Block = {
  id: string;
  type: BlockType;
  content: string;
  imageUrl?: string;
  drawingData?: string;
};

type NoteData = {
  id: string;
  title: string;
  content: { blocks: Block[] };
  plainText: string | null;
  tags: string[];
  isPinned: boolean;
  date: string;
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const BLOCK_TYPES: { type: BlockType; icon: React.ElementType; label: string }[] = [
  { type: 'paragraph', icon: Type, label: 'Đoạn văn' },
  { type: 'heading1', icon: Heading1, label: 'Tiêu đề 1' },
  { type: 'heading2', icon: Heading2, label: 'Tiêu đề 2' },
  { type: 'bulletList', icon: List, label: 'Danh sách' },
  { type: 'numberedList', icon: ListOrdered, label: 'Đánh số' },
  { type: 'quote', icon: Quote, label: 'Trích dẫn' },
  { type: 'code', icon: Code2, label: 'Code' },
  { type: 'divider', icon: Minus, label: 'Đường kẻ' },
  { type: 'image', icon: ImageIcon, label: 'Hình ảnh' },
  { type: 'drawing', icon: Paintbrush, label: 'Vẽ' },
];

function DrawingCanvas({ data, onChange }: { data?: string; onChange: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#ec407a'); // Default to pink
  const [lineWidth, setLineWidth] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    if (data) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = data;
    } else {
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [data]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    setDrawing(false);
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        {['#ec407a', '#ef4444', '#2563eb', '#16a34a', '#000000'].map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={cn(
              'h-5 w-5 rounded-full border-2 transition-transform',
              color === c ? 'scale-125 border-slate-400' : 'border-transparent hover:scale-110'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="range"
          min={1}
          max={8}
          value={lineWidth}
          onChange={e => setLineWidth(Number(e.target.value))}
          className="w-16 ml-2 accent-pink-500"
        />
        <button
          onClick={clearCanvas}
          className="text-xs text-red-500 hover:text-red-600 ml-auto"
        >
          Xóa
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        className="w-full h-[300px] rounded-lg border border-pink-100 cursor-crosshair bg-slate-50"
      />
    </div>
  );
}

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const noteId = params.noteId as string;

  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showToolbar, setShowToolbar] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [reviewItem, setReviewItem] = useState<{ id: string; box: number } | null>(null);

  const fetchNote = useCallback(async () => {
    try {
      const res = await fetch(`/api/deep-workspace/notes/${noteId}`);
      if (res.ok) {
        const data = await res.json();
        setNote(data);
        setTitle(data.title);
        setBlocks(data.content?.blocks || [{ id: generateId(), type: 'paragraph', content: '' }]);
        setTags(data.tags || []);

        // Check review status
        const revRes = await fetch(`/api/deep-workspace/reviews?noteId=${noteId}`);
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviewItem(revData);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => { void fetchNote(); }, [fetchNote]);

  const getPlainText = useCallback(() => {
    return blocks
      .filter(b => b.type !== 'divider' && b.type !== 'image' && b.type !== 'drawing')
      .map(b => b.content)
      .join('\n');
  }, [blocks]);

  const saveNote = async () => {
    setSaving(true);
    try {
      await fetch(`/api/deep-workspace/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: { blocks },
          plainText: getPlainText(),
          tags,
        }),
      });
      setHasChanges(false);
      toast({ title: '💾 Đã lưu', description: 'Ghi chú đã được lưu thành công.' });
    } catch {
      toast({ title: 'Lỗi lưu', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReview = async () => {
    if (reviewItem) {
      // Remove from review queue
      try {
        const res = await fetch(`/api/deep-workspace/reviews/${reviewItem.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setReviewItem(null);
          toast({ description: 'Đã xóa khỏi danh sách ôn tập.' });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Add to review queue
      try {
        const res = await fetch('/api/deep-workspace/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId, title }),
        });
        if (res.ok) {
          const data = await res.json();
          setReviewItem(data);
          toast({ title: 'Đã thêm vào Ôn tập 🧠', description: 'Ghi chú này đã được lên lịch ôn tập ngắt quãng.' });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    setHasChanges(true);
  };

  const addBlock = (afterId: string, type: BlockType = 'paragraph') => {
    const newBlock: Block = { id: generateId(), type, content: '' };
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const newBlocks = [...prev];
      newBlocks.splice(idx + 1, 0, newBlock);
      return newBlocks;
    });
    setHasChanges(true);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return;
    setBlocks(prev => prev.filter(b => b.id !== id));
    setHasChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.type !== 'code') {
        e.preventDefault();
        addBlock(blockId);
      }
    }
    if (e.key === 'Backspace') {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.content === '' && blocks.length > 1) {
        e.preventDefault();
        removeBlock(blockId);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateBlock(blockId, {
        type: 'image',
        imageUrl: reader.result as string,
        content: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (blockId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateBlock(blockId, {
          imageUrl: reader.result as string,
          content: file.name,
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
      setHasChanges(true);
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
    setHasChanges(true);
  };

  const deleteNote = async () => {
    if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
    await fetch(`/api/deep-workspace/notes/${noteId}`, { method: 'DELETE' });
    router.push('/workspace/notes');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không tìm thấy ghi chú</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2 -mx-2 px-2">
        <div className="flex items-center gap-2">
          <Link href="/workspace/notes">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-pink-50/50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-xs text-muted-foreground">
            {new Date(note.date).toLocaleDateString('vi-VN')}
          </span>
          {hasChanges && (
            <span className="text-[10px] text-pink-500 font-medium">● Chưa lưu</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Spaced Repetition Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleReview}
            className={cn(
              "text-xs border-pink-200 h-8",
              reviewItem 
                ? "bg-pink-50 text-pink-700 hover:bg-pink-100/50 hover:text-pink-800" 
                : "text-muted-foreground hover:bg-pink-50/50"
            )}
          >
            <Brain className="h-3.5 w-3.5 mr-1" />
            {reviewItem ? `Ôn tập (Hộp ${reviewItem.box})` : 'Đưa vào Ôn tập'}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={deleteNote}
            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={saveNote}
            disabled={saving}
            className="bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs border-none hover:from-pink-600 hover:to-rose-500 shadow-sm"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            Lưu
          </Button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => { setTitle(e.target.value); setHasChanges(true); }}
        placeholder="Tiêu đề ghi chú..."
        className="w-full text-2xl font-bold border-none outline-none bg-transparent placeholder:text-slate-300 text-text-main"
      />

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-[11px] text-pink-700 border border-pink-200 cursor-pointer hover:bg-pink-100"
            onClick={() => removeTag(tag)}
          >
            {tag} ×
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="Thêm tag..."
          className="text-xs border-none outline-none bg-transparent w-24 placeholder:text-slate-300 text-text-main"
        />
      </div>

      {/* Editor Blocks */}
      <div className="space-y-1 min-h-[50vh]">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="group relative"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, block.id)}
          >
            {/* Block Type Toolbar */}
            <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowToolbar(showToolbar === block.id ? null : block.id)}
                className="h-6 w-6 rounded-md bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-pink-500 text-xs border border-pink-100"
              >
                +
              </button>
            </div>

            {/* Type Selector Dropdown */}
            {showToolbar === block.id && (
              <div className="absolute -left-8 top-8 z-20 rounded-xl border border-pink-100/60 bg-white shadow-lg p-2 space-y-0.5 w-40">
                {BLOCK_TYPES.map(bt => (
                  <button
                    key={bt.type}
                    onClick={() => {
                      if (bt.type === 'divider') {
                        addBlock(block.id, 'divider');
                      } else if (bt.type === 'drawing') {
                        addBlock(block.id, 'drawing');
                      } else if (bt.type === 'image') {
                        addBlock(block.id, 'image');
                      } else {
                        updateBlock(block.id, { type: bt.type });
                      }
                      setShowToolbar(null);
                    }}
                    className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-xs text-text-main hover:bg-pink-50/40 transition-colors"
                  >
                    <bt.icon className="h-3.5 w-3.5 text-pink-500" />
                    {bt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Block Content */}
            {block.type === 'divider' ? (
              <hr className="my-4 border-pink-100/40" />
            ) : block.type === 'image' ? (
              <div className="rounded-xl border border-pink-100/50 bg-slate-50/50 p-2">
                {block.imageUrl ? (
                  <img
                    src={block.imageUrl}
                    alt={block.content}
                    className="max-w-full rounded-lg max-h-[400px] object-contain mx-auto"
                  />
                ) : (
                  <button
                    onClick={() => handleImageUpload(block.id)}
                    className="w-full py-8 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Upload className="h-8 w-8 text-pink-500" />
                    <span className="text-xs">Kéo thả hoặc click để tải hình ảnh</span>
                  </button>
                )}
              </div>
            ) : block.type === 'drawing' ? (
              <DrawingCanvas
                data={block.drawingData}
                onChange={data => updateBlock(block.id, { drawingData: data })}
              />
            ) : block.type === 'code' ? (
              <textarea
                value={block.content}
                onChange={e => updateBlock(block.id, { content: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const target = e.target as HTMLTextAreaElement;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const newVal = block.content.substring(0, start) + '  ' + block.content.substring(end);
                    updateBlock(block.id, { content: newVal });
                  }
                }}
                placeholder="// Viết code ở đây..."
                rows={4}
                className="w-full rounded-xl bg-slate-900 text-slate-100 font-mono text-sm p-4 border-none outline-none resize-y"
              />
            ) : (
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={e => updateBlock(block.id, { content: (e.target as HTMLElement).innerText })}
                onKeyDown={e => handleKeyDown(e, block.id)}
                data-placeholder={
                  block.type === 'heading1' ? 'Tiêu đề chính...' :
                  block.type === 'heading2' ? 'Tiêu đề phụ...' :
                  block.type === 'quote' ? 'Trích dẫn...' :
                  block.type === 'bulletList' ? '• Mục...' :
                  block.type === 'numberedList' ? '1. Mục...' :
                  "Nhập nội dung... (nhấn '+' bên trái để thêm block mới)"
                }
                className={cn(
                  'outline-none border-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 rounded-lg px-2 py-1 -mx-2 transition-colors focus:bg-pink-50/20 text-text-main',
                  block.type === 'heading1' ? 'text-xl font-bold text-text-main' : '',
                  block.type === 'heading2' ? 'text-lg font-semibold text-text-main' : '',
                  block.type === 'quote' ? 'border-l-3 border-pink-300 pl-4 italic text-muted-foreground bg-pink-50/10 rounded-r-lg py-2' : '',
                  block.type === 'bulletList' ? 'pl-6 before:content-["•"] before:absolute before:left-2 before:text-pink-400 relative' : '',
                  block.type === 'numberedList' ? 'pl-6' : '',
                  block.type === 'paragraph' ? 'text-sm leading-relaxed' : '',
                )}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Click anywhere below to add new block */}
      <button
        onClick={() => addBlock(blocks[blocks.length - 1].id)}
        className="w-full py-4 text-xs text-slate-300 hover:text-slate-400 transition-colors"
      >
        + Thêm block mới
      </button>
    </div>
  );
}
