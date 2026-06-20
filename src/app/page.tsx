import { HeroSection } from '@/components/home/HeroSection';
import { FeatureGrid } from '@/components/home/FeatureGrid';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { HighlightStats } from '@/components/home/HighlightStats';
export default async function Home() {

  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeatureGrid />
      <HowItWorksSection />
      <HighlightStats />
    </div>
  );
}
