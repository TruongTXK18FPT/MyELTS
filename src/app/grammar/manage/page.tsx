import { auth } from '@/auth';
import { GrammarFormManager } from '@/components/grammar/GrammarFormManager';
import { getGrammarForUser, mapSeedToGrammarItems, seedGrammarForUser } from '@/lib/grammar-data';

export default async function GrammarManagePage() {
  const session = await auth();

  let initialGrammar = mapSeedToGrammarItems();

  if (session?.user?.id) {
    await seedGrammarForUser(session.user.id);
    initialGrammar = await getGrammarForUser(session.user.id);
  }

  return (
    <div className="container py-8 md:py-12">
      <GrammarFormManager initialGrammar={initialGrammar} />
    </div>
  );
}
