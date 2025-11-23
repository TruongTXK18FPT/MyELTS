import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

type VocabItem = {
  word: string;
  phonetic: string;
  type: string;
  meaning: string;
  example: string;
  topic: string;
};

type VocabularyListProps = {
  vocabulary: VocabItem[];
};

export function VocabularyList({ vocabulary }: VocabularyListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {vocabulary.map((item, index) => (
        <Card key={index} className="flex flex-col">
          <CardContent className="flex flex-col p-6 flex-grow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-headline text-xl font-bold text-text-main">{item.word}</h3>
                <p className="text-sm text-text-muted">{item.phonetic}</p>
              </div>
              <Badge variant="secondary">{item.type}</Badge>
            </div>
            <p className="font-semibold text-primary-dark">{item.meaning}</p>
            <p className="mt-2 text-sm text-text-muted italic">"{item.example}"</p>
            <div className="flex-grow" />
            <div className="mt-4 flex items-center justify-between">
              <Badge variant="outline">{item.topic}</Badge>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Bookmark className="h-5 w-5" />
                <span className="sr-only">Bookmark</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
