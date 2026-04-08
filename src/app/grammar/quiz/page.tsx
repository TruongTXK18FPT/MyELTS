import { auth } from '@/auth';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { GrammarQuizCenter } from '@/components/grammar/GrammarQuizCenter';
import { getGrammarForUser, mapSeedToGrammarItems, seedGrammarForUser } from '@/lib/grammar-data';

export default async function GrammarQuizPage() {
  const session = await auth();

  let initialGrammar = mapSeedToGrammarItems();

  if (session?.user?.id) {
    await seedGrammarForUser(session.user.id);
    initialGrammar = await getGrammarForUser(session.user.id);
  }

  return (
    <div className="container py-8 md:py-12">
      <SectionTitle
        align="left"
        title="Grammar Quiz Center"
        subtitle="Tạo đề kiểm tra ngữ pháp bằng AI theo chủ điểm bạn chọn, gồm trắc nghiệm và tự luận tối đa 30 câu."
      />

      <div className="mt-8">
        <GrammarQuizCenter initialGrammar={initialGrammar} />
      </div>
    </div>
  );
}
