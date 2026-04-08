import Link from 'next/link';
import { auth } from '@/auth';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { GrammarMindmapView } from '@/components/grammar/GrammarMindmapView';
import { getGrammarForUser, mapSeedToGrammarItems, seedGrammarForUser } from '@/lib/grammar-data';

export default async function GrammarMindmapPage() {
  const session = await auth();

  let initialGrammar = mapSeedToGrammarItems();

  if (session?.user?.id) {
    await seedGrammarForUser(session.user.id);
    initialGrammar = await getGrammarForUser(session.user.id);
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/grammar">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về trang Grammar
          </Link>
        </Button>
      </div>

      <SectionTitle
        align="left"
        title="Grammar Mindmap View"
        subtitle="Tổng hợp toàn bộ chủ điểm ngữ pháp thành sơ đồ tư duy để học và ôn lại nhanh hơn."
      />

      <div className="mt-8">
        <GrammarMindmapView items={initialGrammar} />
      </div>
    </div>
  );
}
