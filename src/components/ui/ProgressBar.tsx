'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ProgressBarProps = {
  value: number; // 0-100
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <Progress
      value={value}
      className={cn('h-2 rounded-full bg-primary-light', className)}
      indicatorClassName="bg-primary-dark rounded-full"
    />
  );
}

// Need to modify original progress component to accept indicatorClassName
// For now, let's adjust the base component
