import Link from 'next/link';
import { Brain, PlusCircle, Target } from 'lucide-react';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/button';

export function GrammarHeader() {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-secondary/50 p-6 text-center md:flex-row md:text-left">
      <div className="flex-1">
        <SectionTitle
          align="left"
          title="Ngân hàng Ngữ pháp IELTS"
          subtitle="Quản lý điểm ngữ pháp, luyện tập theo từng chủ điểm và tạo quiz AI theo nhu cầu của bạn."
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2 md:justify-end">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/grammar/quiz">
            <Target className="mr-2 h-4 w-4" />
            Quiz Center
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/grammar/mindmap">
            <Brain className="mr-2 h-4 w-4" />
            Mindmap
          </Link>
        </Button>
        <Button asChild className="rounded-full shadow-md">
          <Link href="/grammar/manage">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm ngữ pháp
          </Link>
        </Button>
      </div>
    </div>
  );
}
