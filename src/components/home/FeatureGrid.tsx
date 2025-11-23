import { SectionTitle } from '@/components/ui/SectionTitle';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpenCheck, BotMessageSquare, AreaChart, Route, Sparkles, PencilRuler } from 'lucide-react';

const features = [
  {
    icon: <BookOpenCheck className="h-8 w-8 text-primary" />,
    title: 'AI Test Center',
    description: 'Thi thử không giới hạn với kho đề được tạo bởi AI, bám sát cấu trúc đề thi thật.',
    badge: 'AI Inside',
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: 'Vocabulary Hub',
    description: 'Học từ vựng theo chủ đề, band điểm, kèm hình ảnh minh họa và ví dụ trực quan.',
    badge: 'AI Inside',
  },
  {
    icon: <BotMessageSquare className="h-8 w-8 text-primary" />,
    title: 'IELTS Chat AI',
    description: 'Trò chuyện song ngữ Anh-Việt, hỏi đáp mọi thắc mắc về IELTS và được sửa lỗi tức thì.',
    badge: 'AI Inside',
  },
  {
    icon: <Route className="h-8 w-8 text-primary" />,
    title: 'Roadmap cá nhân hóa',
    description: 'AI phân tích điểm yếu và tạo lộ trình học tập tối ưu, giúp bạn đạt mục tiêu nhanh nhất.',
    badge: 'AI Inside',
  },
  {
    icon: <AreaChart className="h-8 w-8 text-primary" />,
    title: 'Academic Dashboard',
    description: 'Theo dõi tiến độ, xem lại lịch sử bài làm và nhận báo cáo chi tiết về năng lực của bạn.',
  },
   {
    icon: <PencilRuler className="h-8 w-8 text-primary" />,
    title: 'Speaking & Writing',
    description: 'AI chấm điểm và phân tích lỗi chi tiết cho bài nói và bài viết của bạn.',
    badge: 'AI Inside',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="container py-12 md:py-24">
      <SectionTitle
        title="Toàn diện tính năng, tối ưu cho người tự học"
        subtitle="MyELTS trang bị đầy đủ công cụ bạn cần để chinh phục kỳ thi IELTS, tất cả trong một nền tảng duy nhất."
      />
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index} className="group transform-gpu transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20 bg-white">
            <CardHeader className="p-8">
              <div className="flex items-start justify-between">
                {feature.icon}
                {feature.badge && <Badge variant="secondary">{feature.badge}</Badge>}
              </div>
              <CardTitle className="pt-4 text-xl">{feature.title}</CardTitle>
              <CardDescription className="text-base">{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
