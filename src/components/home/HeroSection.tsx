import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookCheck, Mic, FileText } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function HeroSection() {
  const heroMockup1 = PlaceHolderImages.find(p => p.id === 'hero-mockup-1');
  const heroMockup2 = PlaceHolderImages.find(p => p.id === 'hero-mockup-2');

  return (
    <section className="container pt-12 pb-12 md:pt-24">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-8">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Badge variant="outline" className="border-primary-soft bg-primary-light text-primary-dark font-medium mb-4">
            AI-powered IELTS platform
          </Badge>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-text-main sm:text-5xl md:text-6xl">
            Nền tảng học IELTS thông minh bằng AI
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted">
            Luyện 4 kỹ năng, nhận lộ trình cá nhân hóa và được chấm điểm chi tiết bằng trí tuệ nhân tạo để đạt band điểm mơ ước.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-primary-dark text-white hover:brightness-105"
            >
              <Link href="/register">Bắt đầu học ngay</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="rounded-full border-2 border-primary-soft px-8 py-6 text-base font-semibold"
            >
              <Link href="#features">Xem demo tính năng</Link>
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start">
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <BookCheck className="h-4 w-4 text-primary" /> +200 đề luyện
            </span>
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <Mic className="h-4 w-4 text-primary" /> AI chấm Speaking
            </span>
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <FileText className="h-4 w-4 text-primary" /> AI chấm Writing
            </span>
          </div>
        </div>

        <div className="relative hidden h-full min-h-[300px] items-center justify-center md:flex">
            {heroMockup1 && heroMockup2 && (
                <>
                <div className="absolute top-0 right-0 z-10 w-[60%] transform-gpu transition-transform hover:scale-105">
                    <Image
                    src={heroMockup1.imageUrl}
                    alt={heroMockup1.description}
                    width={400}
                    height={550}
                    className="rounded-2xl object-cover shadow-2xl shadow-primary/20"
                    data-ai-hint={heroMockup1.imageHint}
                    />
                </div>
                <div className="absolute bottom-0 left-0 w-[55%] transform-gpu transition-transform hover:scale-105">
                    <Image
                    src={heroMockup2.imageUrl}
                    alt={heroMockup2.description}
                    width={380}
                    height={500}
                    className="rounded-2xl object-cover shadow-2xl shadow-primary/20"
                    data-ai-hint={heroMockup2.imageHint}
                    />
                </div>
                </>
            )}
        </div>
      </div>
    </section>
  );
}
