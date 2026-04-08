import type { TutorType } from '@/lib/chat-utils';

export type TutorDomain = 'WRITING' | 'LISTENING' | 'SPEAKING' | 'READING';

export type TutorCard = {
  type: TutorType;
  name: string;
  subtitle: string;
  description: string;
  emoji: string;
  accent: string;
  domain: TutorDomain;
};

export type TutorQuickAction = {
  id: string;
  label: string;
  prompt: string;
};

export const TUTOR_CARDS: TutorCard[] = [
  {
    type: 'WRITING_TASK1',
    name: 'Ms. Sarah',
    subtitle: 'Writing Task 1',
    description: 'Chuyên charts/graphs/diagrams và chấm Task 1 theo 4 criteria.',
    emoji: '🧑‍🏫',
    accent: '#fb7185',
    domain: 'WRITING',
  },
  {
    type: 'WRITING_TASK2',
    name: 'Prof. James',
    subtitle: 'Writing Task 2',
    description: 'Giáo sư lập luận essay, feedback từng đoạn theo band descriptors.',
    emoji: '🧔',
    accent: '#f43f5e',
    domain: 'WRITING',
  },
  {
    type: 'LISTENING',
    name: 'Dr. Emily',
    subtitle: 'Listening',
    description: 'Bài nghe theo part, transcript + strategy và nguồn luyện nghe.',
    emoji: '🎧',
    accent: '#ec4899',
    domain: 'LISTENING',
  },
  {
    type: 'SPEAKING',
    name: 'Coach Alex',
    subtitle: 'Speaking',
    description: 'Mock test, phân tích transcript, coaching phát âm & intonation.',
    emoji: '🎤',
    accent: '#f472b6',
    domain: 'SPEAKING',
  },
  {
    type: 'READING_ACADEMIC',
    name: 'Dr. Sophia',
    subtitle: 'Reading Academic',
    description: 'Passage học thuật, keyword mapping, T/F/NG và từ vựng advanced.',
    emoji: '📚',
    accent: '#fda4af',
    domain: 'READING',
  },
  {
    type: 'READING_GENERAL',
    name: 'Mr. David',
    subtitle: 'Reading General',
    description: 'Bài đọc thực tế GT, skimming/scanning và tăng tốc độ đọc.',
    emoji: '📰',
    accent: '#f9a8d4',
    domain: 'READING',
  },
];

export const TUTOR_QUICK_ACTIONS: Record<TutorType, TutorQuickAction[]> = {
  WRITING_TASK1: [
    {
      id: 'task1-topic',
      label: 'Tạo đề Task 1',
      prompt: 'Hãy tạo một đề IELTS Writing Task 1 mới kèm tiêu chí chấm điểm, và viết phần đề bằng tiếng Anh.',
    },
    {
      id: 'task1-sample',
      label: 'Viết bài mẫu',
      prompt: 'Viết một bài mẫu Band 8 cho đề Task 1 Academic phổ biến bằng tiếng Anh.',
    },
    {
      id: 'task1-eval',
      label: 'Đánh giá bài viết',
      prompt: 'Hãy đánh giá bài Task 1 của tôi theo TA, CC, LR, GRA và nêu cách cải thiện.',
    },
  ],
  WRITING_TASK2: [
    {
      id: 'task2-topic',
      label: 'Tạo đề Task 2',
      prompt: 'Tạo một đề IELTS Writing Task 2 dạng Opinion và gợi ý outline, phần đề bằng tiếng Anh.',
    },
    {
      id: 'task2-sample',
      label: 'Viết bài mẫu',
      prompt: 'Viết bài mẫu Band 8 cho đề Task 2 bằng tiếng Anh và phân tích logic lập luận.',
    },
    {
      id: 'task2-eval',
      label: 'Đánh giá bài viết',
      prompt: 'Chấm bài Task 2 của tôi theo TR, CC, LR, GRA và đề xuất sửa trọng tâm.',
    },
  ],
  LISTENING: [
    {
      id: 'listening-part1',
      label: 'Bài nghe Part 1',
      prompt: 'Tạo một bài nghe IELTS Part 1 kèm transcript, câu hỏi và đáp án bằng tiếng Anh.',
    },
    {
      id: 'listening-movie',
      label: 'Gợi ý phim',
      prompt: 'Gợi ý phim/video YouTube phù hợp luyện listening và cách học hiệu quả.',
    },
    {
      id: 'listening-vocab',
      label: 'Test từ vựng',
      prompt: 'Tạo một mini dictation test bằng tiếng Anh để luyện listening vocabulary.',
    },
  ],
  SPEAKING: [
    {
      id: 'speaking-mock',
      label: 'Mock Part 1',
      prompt: 'Bắt đầu mock IELTS Speaking Part 1 với 8 câu hỏi ngắn bằng tiếng Anh.',
    },
    {
      id: 'speaking-pronunciation',
      label: 'Luyện phát âm',
      prompt: 'Phân tích lỗi phát âm phổ biến của tôi và cho bài luyện 5 phút.',
    },
    {
      id: 'speaking-topic',
      label: 'Topic hôm nay',
      prompt: 'Đưa một topic Speaking Part 2 hôm nay bằng tiếng Anh và khung trả lời band 7+.',
    },
  ],
  READING_ACADEMIC: [
    {
      id: 'reading-ac-passage',
      label: 'Passage mới',
      prompt: 'Tạo một passage Reading Academic kèm 6 câu hỏi T/F/NG bằng tiếng Anh.',
    },
    {
      id: 'reading-ac-keyword',
      label: 'Tìm keyword',
      prompt: 'Dạy tôi cách tìm keyword và evidence trong Reading Academic.',
    },
    {
      id: 'reading-ac-vocab',
      label: 'Từ vựng academic',
      prompt: 'Tạo danh sách từ vựng academic theo chủ đề environment.',
    },
  ],
  READING_GENERAL: [
    {
      id: 'reading-gt-passage',
      label: 'Passage mới',
      prompt: 'Tạo một bài Reading General Training dạng thông báo/quảng cáo bằng tiếng Anh.',
    },
    {
      id: 'reading-gt-speed',
      label: 'Tăng tốc đọc',
      prompt: 'Cho tôi bài luyện skimming-scanning có bấm giờ và cách tự chấm.',
    },
    {
      id: 'reading-gt-keyword',
      label: 'Tìm keyword',
      prompt: 'Hướng dẫn tìm keyword và paraphrase trong bài Reading GT.',
    },
  ],
};

export function getTutorCard(type: TutorType): TutorCard {
  return TUTOR_CARDS.find((item) => item.type === type) || TUTOR_CARDS[0];
}
