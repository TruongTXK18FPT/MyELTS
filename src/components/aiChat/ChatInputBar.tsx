import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, SendHorizonal } from 'lucide-react';

export function ChatInputBar() {
  return (
    <div className="relative">
      <Textarea
        placeholder="Nhập câu hỏi về IELTS..."
        className="min-h-[52px] resize-none rounded-full border-2 border-border bg-surface py-3 pr-28 pl-6"
        rows={1}
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
          <Mic className="h-5 w-5" />
        </Button>
        <Button size="icon" className="rounded-full bg-gradient-to-r from-primary to-primary-dark shadow-lg">
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
