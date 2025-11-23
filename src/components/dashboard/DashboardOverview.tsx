import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Gauge, BookCheck, Target, FileSignature } from 'lucide-react';

const stats = [
  {
    icon: <Gauge className="h-7 w-7 text-primary" />,
    label: 'Overall Band Hiện tại',
    value: '6.0',
  },
  {
    icon: <BookCheck className="h-7 w-7 text-primary" />,
    label: 'Điểm Reading Mới Nhất',
    value: '6.5',
  },
  {
    icon: <Target className="h-7 w-7 text-primary" />,
    label: 'Từ Vựng Đã Lưu',
    value: '258',
  },
  {
    icon: <FileSignature className="h-7 w-7 text-primary" />,
    label: 'Số Bài Test Đã Làm',
    value: '14',
  },
];

export function DashboardOverview() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">{stat.label}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline text-text-main">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
