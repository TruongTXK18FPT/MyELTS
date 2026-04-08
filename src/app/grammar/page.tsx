import { auth } from '@/auth';
import Link from 'next/link';
import { GrammarHeader } from '@/components/grammar/GrammarHeader';
import { GrammarManager } from '@/components/grammar/GrammarManager';
import { Button } from '@/components/ui/button';
import { Brain, Target } from 'lucide-react';
import { getGrammarForUser, mapSeedToGrammarItems, seedGrammarForUser } from '@/lib/grammar-data';

export default async function GrammarPage() {
  const session = await auth();

  let initialGrammar = mapSeedToGrammarItems();

  if (session?.user?.id) {
    await seedGrammarForUser(session.user.id);
    initialGrammar = await getGrammarForUser(session.user.id);
  }

  return (
    <div className="container py-8 md:py-12">
      <GrammarHeader />

      <div className="mt-8 rounded-xl border border-primary/15 bg-secondary/20 p-4 text-sm text-text-muted">
        Nội dung trong kho ngữ pháp được biên soạn lại theo hướng học thuật thực hành cho IELTS, không sao chép nguyên văn từ
        nguồn bên thứ ba. Bạn có thể tự chỉnh sửa và bổ sung toàn bộ nội dung theo nhu cầu.

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/grammar/quiz">
              <Target className="mr-2 h-4 w-4" />
              Sang trang Quiz ngữ pháp
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/grammar/mindmap">
              <Brain className="mr-2 h-4 w-4" />
              Xem chế độ Mindmap toàn bộ
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <GrammarManager initialGrammar={initialGrammar} />
      </div>
    </div>
  );
}
