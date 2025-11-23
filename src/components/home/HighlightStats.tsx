import { Card, CardContent } from '@/components/ui/card';
import { PencilRuler, BookCopy, TrendingUp } from 'lucide-react';

const stats = [
  {
    icon: <PencilRuler className="h-8 w-8 text-primary" />,
    value: '1,200+',
    label: 'Bài test đã làm',
  },
  {
    icon: <BookCopy className="h-8 w-8 text-primary" />,
    value: '5,000+',
    label: 'Từ vựng đã học',
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    value: '+1.0 Band',
    label: 'Mức tăng trung bình',
  },
];

export function HighlightStats() {
  return (
    <section className="container py-12 md:py-24">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-6">
              {stat.icon}
              <p className="font-headline text-4xl font-bold text-primary-dark">{stat.value}</p>
              <p className="text-text-muted">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
