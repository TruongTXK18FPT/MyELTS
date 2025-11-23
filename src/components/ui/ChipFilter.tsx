'use client';

import { cn } from '@/lib/utils';

type ChipFilterProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export function ChipFilter({ label, isActive, onClick }: ChipFilterProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isActive
          ? 'border-transparent bg-primary-dark text-white shadow'
          : 'border-primary-soft bg-white text-primary-dark hover:bg-secondary'
      )}
    >
      {label}
    </button>
  );
}
