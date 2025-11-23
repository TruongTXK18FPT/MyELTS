import { SectionTitle } from '@/components/ui/SectionTitle';
import { TestOverviewCards } from '@/components/tests/TestOverviewCards';

export default function TestsPage() {
  return (
    <div className="container py-8 md:py-12">
      <SectionTitle
        title="AI Test Center"
        subtitle="Thi thử IELTS 4 kỹ năng với đề được tạo bởi AI và chấm điểm tự động."
      />
      <div className="mt-12">
        <TestOverviewCards />
      </div>
    </div>
  );
}
