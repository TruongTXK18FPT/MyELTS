import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export function VocabularyHeader() {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-secondary/50 p-6 text-center md:flex-row md:text-left">
      <div className="flex-1">
        <SectionTitle
          align="left"
          title="Kho từ vựng IELTS"
          subtitle="Học từ vựng IELTS theo chủ đề, có minh họa, phát âm và biểu mẫu quản lý riêng."
        />
      </div>
      <Button asChild className="rounded-full shadow-md">
        <Link href="/vocabulary/manage">
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm từ mới
        </Link>
      </Button>
    </div>
  );
}
