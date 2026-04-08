import {
  LISTENING_SYSTEM_PROMPT,
  listeningExpertFlow,
} from '@/ai/flows/listening-expert';
import {
  READING_ACADEMIC_SYSTEM_PROMPT,
  readingAcademicExpertFlow,
} from '@/ai/flows/reading-academic-expert';
import {
  READING_GENERAL_SYSTEM_PROMPT,
  readingGeneralExpertFlow,
} from '@/ai/flows/reading-general-expert';
import {
  SPEAKING_SYSTEM_PROMPT,
  speakingExpertFlow,
} from '@/ai/flows/speaking-expert';
import {
  WRITING_TASK1_SYSTEM_PROMPT,
  writingTask1ExpertFlow,
} from '@/ai/flows/writing-task1-expert';
import {
  WRITING_TASK2_SYSTEM_PROMPT,
  writingTask2ExpertFlow,
} from '@/ai/flows/writing-task2-expert';
import type { MessageContentType, TutorType } from '@/lib/chat-utils';

export type TutorQuickAction = {
  id: string;
  label: string;
  prompt: string;
};

export type TutorDefinition = {
  type: TutorType;
  name: string;
  subtitle: string;
  description: string;
  emoji: string;
  accent: string;
  domain: 'WRITING' | 'LISTENING' | 'SPEAKING' | 'READING';
  defaultContentType: MessageContentType;
  systemPrompt: string;
  quickActions: TutorQuickAction[];
  flow: (typeof writingTask1ExpertFlow) | (typeof writingTask2ExpertFlow) | (typeof listeningExpertFlow) | (typeof speakingExpertFlow) | (typeof readingAcademicExpertFlow) | (typeof readingGeneralExpertFlow);
};

export const CHAT_MODEL_DEFAULT = process.env.MISTRAL_CHAT_MODEL || 'mistral-small-latest';
export const CHAT_MODEL_WRITING_EVAL = process.env.MISTRAL_WRITING_MODEL || CHAT_MODEL_DEFAULT;
export const MISTRAL_STT_MODEL = process.env.MISTRAL_STT_MODEL || 'voxtral-mini-transcribe-realtime-2602';
export const MISTRAL_TTS_MODEL = process.env.MISTRAL_TTS_MODEL || 'voxtral-mini-tts-2603';

export const TUTOR_DEFINITIONS: TutorDefinition[] = [
  {
    type: 'WRITING_TASK1',
    name: 'Ms. Sarah',
    subtitle: 'Writing Task 1 Expert',
    description: 'Charts, graphs, maps, process diagrams, and accurate Task 1 band-based feedback.',
    emoji: '🧑‍🏫',
    accent: '#fb7185',
    domain: 'WRITING',
    defaultContentType: 'ESSAY_EVALUATION',
    systemPrompt: WRITING_TASK1_SYSTEM_PROMPT,
    flow: writingTask1ExpertFlow,
    quickActions: [
      {
        id: 'task1-topic',
        label: 'Tạo đề Task 1',
        prompt: 'Hãy tạo một đề IELTS Writing Task 1 mới kèm tiêu chí chấm điểm, và viết phần đề bằng tiếng Anh.',
      },
      {
        id: 'task1-sample',
        label: 'Viết bài mẫu',
        prompt: 'Hãy viết bài mẫu Band 8 cho một đề Task 1 Academic phổ biến bằng tiếng Anh.',
      },
      {
        id: 'task1-eval',
        label: 'Đánh giá bài viết',
        prompt: 'Hãy đánh giá bài Task 1 của tôi theo TA, CC, LR, GRA và nêu cách cải thiện.',
      },
    ],
  },
  {
    type: 'WRITING_TASK2',
    name: 'Prof. James',
    subtitle: 'Writing Task 2 Professor',
    description: 'Essay arguments, idea development, and detailed rubric-based grading.',
    emoji: '🧔',
    accent: '#f43f5e',
    domain: 'WRITING',
    defaultContentType: 'ESSAY_EVALUATION',
    systemPrompt: WRITING_TASK2_SYSTEM_PROMPT,
    flow: writingTask2ExpertFlow,
    quickActions: [
      {
        id: 'task2-topic',
        label: 'Tạo đề Task 2',
        prompt: 'Tạo một đề IELTS Writing Task 2 dạng Opinion và gợi ý outline, phần đề bằng tiếng Anh.',
      },
      {
        id: 'task2-sample',
        label: 'Viết bài mẫu',
        prompt: 'Viết bài mẫu Band 8 cho đề Task 2 bằng tiếng Anh và giải thích chiến lược lập luận.',
      },
      {
        id: 'task2-eval',
        label: 'Đánh giá bài viết',
        prompt: 'Chấm bài Task 2 của tôi theo TR, CC, LR, GRA và đề xuất sửa đoạn yếu nhất.',
      },
    ],
  },
  {
    type: 'LISTENING',
    name: 'Dr. Emily',
    subtitle: 'Listening Specialist',
    description: 'Transcript drills, part-based listening practice, and strategy coaching.',
    emoji: '🎧',
    accent: '#ec4899',
    domain: 'LISTENING',
    defaultContentType: 'LISTENING_EXERCISE',
    systemPrompt: LISTENING_SYSTEM_PROMPT,
    flow: listeningExpertFlow,
    quickActions: [
      {
        id: 'listening-part1',
        label: 'Bài nghe Part 1',
        prompt: 'Tạo một bài nghe IELTS Part 1 kèm transcript, 5 câu hỏi và đáp án bằng tiếng Anh.',
      },
      {
        id: 'listening-movie',
        label: 'Gợi ý phim',
        prompt: 'Gợi ý 3 đoạn phim hoặc video YouTube phù hợp luyện listening và cách học hiệu quả.',
      },
      {
        id: 'listening-vocab',
        label: 'Test từ vựng',
        prompt: 'Tạo bài dictation ngắn bằng tiếng Anh để luyện nghe từ vựng IELTS theo level intermediate.',
      },
    ],
  },
  {
    type: 'SPEAKING',
    name: 'Coach Alex',
    subtitle: 'Speaking Coach',
    description: 'Mock speaking tests, transcript analysis, and pronunciation coaching.',
    emoji: '🎤',
    accent: '#f472b6',
    domain: 'SPEAKING',
    defaultContentType: 'SPEAKING_FEEDBACK',
    systemPrompt: SPEAKING_SYSTEM_PROMPT,
    flow: speakingExpertFlow,
    quickActions: [
      {
        id: 'speaking-mock',
        label: 'Mock Part 1',
        prompt: 'Hãy bắt đầu một mock IELTS Speaking Part 1 với 8 câu hỏi ngắn bằng tiếng Anh.',
      },
      {
        id: 'speaking-pronunciation',
        label: 'Luyện phát âm',
        prompt: 'Cho tôi một bài luyện phát âm 5 phút với stress và intonation.',
      },
      {
        id: 'speaking-topic',
        label: 'Topic hôm nay',
        prompt: 'Đưa một topic Speaking Part 2 hôm nay bằng tiếng Anh và khung trả lời band 7+.',
      },
    ],
  },
  {
    type: 'READING_ACADEMIC',
    name: 'Dr. Sophia',
    subtitle: 'Reading Academic Expert',
    description: 'Academic passages, keyword mapping, and IELTS reading strategies.',
    emoji: '📚',
    accent: '#fda4af',
    domain: 'READING',
    defaultContentType: 'READING_PASSAGE',
    systemPrompt: READING_ACADEMIC_SYSTEM_PROMPT,
    flow: readingAcademicExpertFlow,
    quickActions: [
      {
        id: 'academic-passage',
        label: 'Passage mới',
        prompt: 'Tạo một passage Reading Academic kèm 6 câu hỏi T/F/NG bằng tiếng Anh.',
      },
      {
        id: 'academic-keyword',
        label: 'Tìm keyword',
        prompt: 'Hướng dẫn cách tìm keyword và định vị evidence trong bài reading academic.',
      },
      {
        id: 'academic-vocab',
        label: 'Từ vựng academic',
        prompt: 'Tạo danh sách từ vựng academic theo chủ đề environment kèm ví dụ.',
      },
    ],
  },
  {
    type: 'READING_GENERAL',
    name: 'Mr. David',
    subtitle: 'Reading General Expert',
    description: 'General Training texts, practical reading skills, and speed improvement.',
    emoji: '📰',
    accent: '#f9a8d4',
    domain: 'READING',
    defaultContentType: 'READING_PASSAGE',
    systemPrompt: READING_GENERAL_SYSTEM_PROMPT,
    flow: readingGeneralExpertFlow,
    quickActions: [
      {
        id: 'general-passage',
        label: 'Passage mới',
        prompt: 'Tạo một bài Reading General Training từ ngữ cảnh đời sống thực tế bằng tiếng Anh.',
      },
      {
        id: 'general-skimming',
        label: 'Skimming nhanh',
        prompt: 'Dạy tôi kỹ thuật skimming và scanning để tăng tốc độ làm bài Reading GT.',
      },
      {
        id: 'general-practice',
        label: 'Luyện tốc độ đọc',
        prompt: 'Tạo một bài luyện đọc có bấm giờ 8 phút và hướng dẫn tự chấm.',
      },
    ],
  },
];

export const TUTOR_MAP = Object.fromEntries(TUTOR_DEFINITIONS.map((item) => [item.type, item])) as Record<
  TutorType,
  TutorDefinition
>;

export function getTutorDefinition(type: TutorType): TutorDefinition {
  return TUTOR_MAP[type];
}

export function getTutorSystemPrompt(type: TutorType): string {
  return getTutorDefinition(type).systemPrompt;
}

export function getTutorQuickActions(type: TutorType): TutorQuickAction[] {
  return getTutorDefinition(type).quickActions;
}
