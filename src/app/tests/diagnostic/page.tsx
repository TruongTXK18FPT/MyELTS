import { DiagnosticPlacementTest } from '@/components/tests/DiagnosticPlacementTest';
import { SectionTitle } from '@/components/ui/SectionTitle';

export default function DiagnosticTestPage() {
  return (
    <div className="container py-8 md:py-12">
      <SectionTitle
        title="Diagnostic Placement Test"
        subtitle="Làm bài test đầu vào để hệ thống ước tính band hiện tại, sau đó tạo roadmap học tập cá nhân hóa."
      />

      <div className="mt-10">
        <DiagnosticPlacementTest />
      </div>
    </div>
  );
}
