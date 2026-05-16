import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Headphones, PenSquare, Mic, Files } from 'lucide-react';
import Link from 'next/link';

const testTypes = [
  {
    icon: <Files className="h-8 w-8 text-primary" />,
    title: 'Diagnostic Placement',
    description: 'Bai test dau vao 20 cau de uoc tinh band hien tai va tao roadmap tu dong.',
    href: '/tests/diagnostic',
    ctaLabel: 'Lam test dau vao',
    badgeLabel: 'Start Here',
    badgeClassName: 'bg-primary-dark',
  },
  {
    icon: <Files className="h-8 w-8 text-primary" />,
    title: 'Full Test',
    description: 'Trải nghiệm bài thi đầy đủ 4 kỹ năng trong 2 giờ 45 phút.',
    href: '#',
    ctaLabel: 'Bat dau',
    badgeLabel: 'Recommended',
    badgeClassName: 'bg-primary-dark',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Reading',
    description: 'Luyện kỹ năng đọc hiểu với 3 bài đọc và 40 câu hỏi.',
    href: '#',
    ctaLabel: 'Bat dau',
  },
  {
    icon: <Headphones className="h-8 w-8 text-primary" />,
    title: 'Listening',
    description: 'Nghe 4 đoạn ghi âm và trả lời 40 câu hỏi trắc nghiệm.',
    href: '#',
    ctaLabel: 'Bat dau',
  },
  {
    icon: <PenSquare className="h-8 w-8 text-primary" />,
    title: 'Writing',
    description: 'Viết Task 1 và Task 2, nhận điểm và góp ý chi tiết từ AI.',
    href: '#',
    ctaLabel: 'Bat dau',
  },
  {
    icon: <Mic className="h-8 w-8 text-primary" />,
    title: 'Speaking',
    description: 'Thực hành 3 phần thi nói và được AI đánh giá phát âm, lưu loát.',
    href: '#',
    ctaLabel: 'Bat dau',
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
                {test.badgeLabel && <Badge variant="destructive" className={test.badgeClassName}>{test.badgeLabel}</Badge>}
            </div>
            <CardTitle className="pt-4">{test.title}</CardTitle>
            <CardDescription>{test.description}</CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button asChild className="w-full rounded-full">
              <Link href={test.href}>{test.ctaLabel}</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
