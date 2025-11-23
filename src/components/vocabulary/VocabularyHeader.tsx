import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export function VocabularyHeader() {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-secondary/50 p-6 text-center md:flex-row md:text-left">
      <div className="flex-1">
        <SectionTitle
          align="left"
          title="Vocabulary Hub"
          subtitle="Học từ vựng IELTS theo chủ đề, band điểm, có minh họa & AI giải nghĩa."
        />
      </div>
      <Button className="rounded-full shadow-md">
        <PlusCircle className="mr-2 h-4 w-4" />
        Tạo quiz từ từ đã lưu
      </Button>
    </div>
  );
}
