import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Headphones, PenSquare, Mic, Files } from 'lucide-react';
import Link from 'next/link';

const testTypes = [
  {
    icon: <Files className="h-8 w-8 text-primary" />,
    title: 'Full Test',
    description: 'Trải nghiệm bài thi đầy đủ 4 kỹ năng trong 2 giờ 45 phút.',
    isRecommended: true,
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Reading',
    description: 'Luyện kỹ năng đọc hiểu với 3 bài đọc và 40 câu hỏi.',
  },
  {
    icon: <Headphones className="h-8 w-8 text-primary" />,
    title: 'Listening',
    description: 'Nghe 4 đoạn ghi âm và trả lời 40 câu hỏi trắc nghiệm.',
  },
  {
    icon: <PenSquare className="h-8 w-8 text-primary" />,
    title: 'Writing',
    description: 'Viết Task 1 và Task 2, nhận điểm và góp ý chi tiết từ AI.',
  },
  {
    icon: <Mic className="h-8 w-8 text-primary" />,
    title: 'Speaking',
    description: 'Thực hành 3 phần thi nói và được AI đánh giá phát âm, lưu loát.',
  },
];

export function TestOverviewCards() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {testTypes.map((test, index) => (
        <Card key={index} className="flex flex-col transform-gpu transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
                {test.icon}
                {test.isRecommended && <Badge variant="destructive" className="bg-primary-dark">Recommended</Badge>}
            </div>
            <CardTitle className="pt-4">{test.title}</CardTitle>
            <CardDescription>{test.description}</CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button asChild className="w-full rounded-full">
              <Link href="#">Bắt đầu</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
