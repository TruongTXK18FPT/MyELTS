import { VocabularyHeader } from '@/components/vocabulary/VocabularyHeader';
import { VocabularyFilterBar } from '@/components/vocabulary/VocabularyFilterBar';
import { VocabularyList } from '@/components/vocabulary/VocabularyList';

export default function VocabularyPage() {
  // In a real app, state for filters would be managed here
  const mockVocab = [
    {
      word: 'Conundrum',
      phonetic: '/kəˈnʌndrəm/',
      type: 'noun',
      meaning: 'Câu đố, vấn đề khó',
      example: 'The team faced a conundrum when the project funding was cut.',
      topic: 'Work',
    },
    {
      word: 'Ephemeral',
      phonetic: '/ɪˈfɛmərəl/',
      type: 'adjective',
      meaning: 'Phù du, chóng tàn',
      example: 'The beauty of the cherry blossoms is ephemeral.',
      topic: 'Nature',
    },
    {
      word: 'Alleviate',
      phonetic: '/əˈliːvieɪt/',
      type: 'verb',
      meaning: 'Làm giảm bớt',
      example: 'The medicine helped to alleviate her pain.',
      topic: 'Health',
    },
     {
      word: 'Ubiquitous',
      phonetic: '/juːˈbɪkwɪtəs/',
      type: 'adjective',
      meaning: 'Phổ biến, ở đâu cũng có',
      example: 'Smartphones have become ubiquitous in modern society.',
      topic: 'Technology',
    },
    {
      word: 'Pedagogy',
      phonetic: '/ˈpɛdəɡɒdʒi/',
      type: 'noun',
      meaning: 'Khoa sư phạm',
      example: 'The new teacher is studying modern pedagogy.',
      topic: 'Education',
    },
    {
      word: 'Sustainable',
      phonetic: '/səˈsteɪnəbl/',
      type: 'adjective',
      meaning: 'Bền vững',
      example: 'We need to find sustainable sources of energy.',
      topic: 'Environment',
    },
  ];


  return (
    <div className="container py-8 md:py-12">
      <VocabularyHeader />
      <VocabularyFilterBar />
      <VocabularyList vocabulary={mockVocab} />
    </div>
  );
}
