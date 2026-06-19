'use server';

/**
 * Deep Plan Generation - AI flow using Mistral
 * Generates daily learning plans based on user's topic, schedule, and learning history.
 * Ensures no knowledge overlap by querying past covered topics.
 */

import { chatCompletion, type MistralMessage } from '@/lib/mistral';
import { prisma } from '@/lib/prisma';

export type PlanGenerationInput = {
  userId: string;
  topic: string;
  description: string;
  startDate: string; // ISO date
  timeSlotStart: string; // "09:00"
  timeSlotEnd: string; // "12:00"
  numberOfDays: number; // How many days to generate
};

export type GeneratedTask = {
  title: string;
  description: string;
  knowledgeArea: string;
  estimatedMinutes: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resources: { type: string; title: string; url?: string }[];
};

export type GeneratedDailyPlan = {
  date: string;
  tasks: GeneratedTask[];
  summary: string;
};

export type PlanGenerationOutput = {
  title: string;
  description: string;
  subTopics: string[];
  dailyPlans: GeneratedDailyPlan[];
};

async function getCoveredTopics(userId: string, topic: string): Promise<string[]> {
  const existingPlans = await prisma.deepPlan.findMany({
    where: {
      userId,
      topic: { contains: topic, mode: 'insensitive' },
      status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
    },
    include: {
      dailyPlans: {
        include: {
          tasks: {
            select: { knowledgeArea: true, title: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const coveredAreas: string[] = [];
  for (const plan of existingPlans) {
    coveredAreas.push(...plan.subTopics);
    for (const daily of plan.dailyPlans) {
      for (const task of daily.tasks) {
        coveredAreas.push(task.knowledgeArea);
        coveredAreas.push(task.title);
      }
    }
  }

  return [...new Set(coveredAreas)];
}

async function getNoteInsights(userId: string): Promise<string> {
  const recentNotes = await prisma.note.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 20,
    select: { title: true, plainText: true, tags: true, date: true },
  });

  if (recentNotes.length === 0) return 'Chưa có ghi chú nào.';

  return recentNotes
    .map(n => `[${n.date.toISOString().split('T')[0]}] ${n.title}: ${(n.plainText || '').slice(0, 200)}`)
    .join('\n');
}

export async function generateDeepPlan(input: PlanGenerationInput): Promise<PlanGenerationOutput> {
  const coveredTopics = await getCoveredTopics(input.userId, input.topic);
  const noteInsights = await getNoteInsights(input.userId);

  // Calculate available minutes per day
  const [startH, startM] = input.timeSlotStart.split(':').map(Number);
  const [endH, endM] = input.timeSlotEnd.split(':').map(Number);
  const availableMinutes = (endH * 60 + endM) - (startH * 60 + startM);

  const systemPrompt = `Bạn là một AI trợ lý lập kế hoạch học tập chuyên nghiệp. Bạn tạo kế hoạch học tập chi tiết, cá nhân hóa dựa trên chủ đề, thời gian rảnh, và lịch sử học tập của người dùng.

NGUYÊN TẮC QUAN TRỌNG:
1. KHÔNG BAO GIỜ lặp lại kiến thức đã học trước đó
2. Kiến thức phải tiến triển từ cơ bản đến nâng cao một cách tự nhiên
3. Mỗi ngày phải có mục tiêu rõ ràng và đo lường được
4. Tasks phải thực tế với thời gian cho phép
5. Đề xuất tài liệu cụ thể (link, sách, bài viết)
6. Trả lời hoàn toàn bằng tiếng Việt

Trả về JSON theo đúng format được yêu cầu.`;

  const userPrompt = `Tạo kế hoạch học tập cho chủ đề: "${input.topic}"

Mô tả chi tiết: ${input.description}

Thông tin lịch trình:
- Ngày bắt đầu: ${input.startDate}
- Số ngày: ${input.numberOfDays}
- Khung giờ mỗi ngày: ${input.timeSlotStart} - ${input.timeSlotEnd} (${availableMinutes} phút)

Các kiến thức ĐÃ HỌC (KHÔNG ĐƯỢC LẶP LẠI):
${coveredTopics.length > 0 ? coveredTopics.join(', ') : 'Chưa có - đây là lần đầu tiên'}

Ghi chú gần đây của người dùng (để hiểu tiến độ):
${noteInsights}

Trả về JSON với format:
{
  "title": "Tên kế hoạch ngắn gọn",
  "description": "Mô tả tổng quan kế hoạch",
  "subTopics": ["Danh sách các chủ đề con sẽ cover"],
  "dailyPlans": [
    {
      "date": "YYYY-MM-DD",
      "summary": "Tóm tắt mục tiêu ngày",
      "tasks": [
        {
          "title": "Tên task cụ thể",
          "description": "Mô tả chi tiết nội dung cần học/làm",
          "knowledgeArea": "Lĩnh vực kiến thức cụ thể",
          "estimatedMinutes": 30,
          "priority": "HIGH",
          "resources": [
            {"type": "article", "title": "Tên tài liệu", "url": "https://..."}
          ]
        }
      ]
    }
  ]
}`;

  const messages: MistralMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 8192,
    responseFormat: { type: 'json_object' },
  });

  try {
    const parsed = JSON.parse(response) as PlanGenerationOutput;
    return parsed;
  } catch {
    throw new Error('AI trả về format không hợp lệ. Vui lòng thử lại.');
  }
}

export async function refinePlan(
  currentPlan: PlanGenerationOutput,
  editRequest: string
): Promise<PlanGenerationOutput> {
  const systemPrompt = `Bạn là AI trợ lý chỉnh sửa kế hoạch học tập. Người dùng muốn điều chỉnh kế hoạch hiện tại.
Giữ nguyên format JSON và chỉ thay đổi những phần người dùng yêu cầu.
Trả lời hoàn toàn bằng tiếng Việt.`;

  const userPrompt = `Kế hoạch hiện tại:
${JSON.stringify(currentPlan, null, 2)}

Yêu cầu chỉnh sửa của người dùng:
"${editRequest}"

Trả về kế hoạch đã chỉnh sửa theo đúng JSON format như trên.`;

  const messages: MistralMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.5,
    maxTokens: 8192,
    responseFormat: { type: 'json_object' },
  });

  try {
    return JSON.parse(response) as PlanGenerationOutput;
  } catch {
    throw new Error('AI chỉnh sửa thất bại. Vui lòng thử lại.');
  }
}
