import { HeroSection } from '@/components/home/HeroSection';
import { FeatureGrid } from '@/components/home/FeatureGrid';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { HighlightStats } from '@/components/home/HighlightStats';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect('/workspace');
  }

  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeatureGrid />
      <HowItWorksSection />
      <HighlightStats />
    </div>
  );
}
