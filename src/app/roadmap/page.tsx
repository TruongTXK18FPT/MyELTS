import { SectionTitle } from '@/components/ui/SectionTitle';
import { RoadmapPlanner } from '@/components/roadmap/RoadmapPlanner';

export default function RoadmapPage() {
  return (
    <div className="container py-8 md:py-12">
      <SectionTitle
        title="Learning Roadmap"
        subtitle="Roadmap được tạo từ Diagnostic Placement Test và tự động điều chỉnh theo tiến độ học tập."
      />

      <RoadmapPlanner />
    </div>
  );
}
