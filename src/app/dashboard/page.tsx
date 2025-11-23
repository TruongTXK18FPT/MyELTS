import { SectionTitle } from '@/components/ui/SectionTitle';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { DashboardChartsPlaceholder } from '@/components/dashboard/DashboardChartsPlaceholder';

export default function DashboardPage() {
  return (
    <div className="container py-8 md:py-12">
      <SectionTitle
        title="Performance Dashboard"
        subtitle="Theo dõi tiến bộ và phân tích kết quả học tập của bạn."
      />
      <div className="mt-8 space-y-8">
        <DashboardOverview />
        <DashboardChartsPlaceholder />
      </div>
    </div>
  );
}
