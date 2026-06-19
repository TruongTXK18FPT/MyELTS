/**
 * Deep Workspace utility functions and types
 */

export type DeepPlanStatusType = 'DRAFT' | 'PENDING_EDIT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type PlanTaskStatusType = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type PlanTaskPriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const planStatusLabels: Record<DeepPlanStatusType, string> = {
  DRAFT: 'Bản nháp',
  PENDING_EDIT: 'Đang chỉnh sửa',
  APPROVED: 'Đã duyệt',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  ARCHIVED: 'Đã lưu trữ',
};

export const planStatusColors: Record<DeepPlanStatusType, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
  PENDING_EDIT: 'bg-amber-50 text-amber-700 border-amber-300',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-300',
  IN_PROGRESS: 'bg-pink-50 text-pink-700 border-pink-300',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  ARCHIVED: 'bg-gray-50 text-gray-500 border-gray-300',
};

export const taskStatusLabels: Record<PlanTaskStatusType, string> = {
  TODO: 'Chưa làm',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Hoàn thành',
  SKIPPED: 'Bỏ qua',
};

export const taskPriorityLabels: Record<PlanTaskPriorityType, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Quan trọng',
};

export const taskPriorityColors: Record<PlanTaskPriorityType, string> = {
  LOW: 'text-slate-500',
  MEDIUM: 'text-blue-500',
  HIGH: 'text-amber-500',
  CRITICAL: 'text-red-500',
};

export function formatDateVN(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

export function calculateDailyCompletion(
  tasks: Array<{ status: PlanTaskStatusType }>
): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  return Math.round((completed / tasks.length) * 100);
}

export function getStreakDays(
  dailyPlans: Array<{ date: Date | string; completionRate: number }>
): number {
  if (dailyPlans.length === 0) return 0;

  const sorted = [...dailyPlans]
    .filter(d => d.completionRate >= 50)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const planDate = new Date(sorted[i].date);
    planDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (planDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
