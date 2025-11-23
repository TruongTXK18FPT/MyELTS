import { SectionTitle } from '@/components/ui/SectionTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RoadmapTimeline } from '@/components/roadmap/RoadmapTimeline';

export default function RoadmapPage() {
  return (
    <div className="container py-8 md:py-12">
      <SectionTitle
        title="Learning Roadmap"
        subtitle="Lộ trình học cá nhân hóa theo mục tiêu band và thời gian của bạn."
      />

      <Card className="mt-8">
        <CardHeader>
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-sm text-text-muted">Band hiện tại</p>
                <p className="font-headline text-3xl font-bold text-text-main">5.5</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-text-muted">Band mục tiêu</p>
                <p className="font-headline text-3xl font-bold text-primary-dark">7.0</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-text-muted">Thời gian dự kiến</p>
              <p className="font-headline text-2xl font-bold text-text-main">3 Tháng</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-text-muted">
                <span>Tiến độ</span>
                <span>42%</span>
            </div>
            <ProgressBar value={42} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-12">
        <RoadmapTimeline />
      </div>
    </div>
  );
}
