'use client';

import { Button } from '@/components/ui/button';
import type { TutorQuickAction } from '@/lib/tutor-client';

type QuickActionsProps = {
  actions: TutorQuickAction[];
  disabled?: boolean;
  onSelect: (action: TutorQuickAction) => void;
};

export function QuickActions({ actions, disabled, onSelect }: QuickActionsProps) {
  if (!actions.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="rounded-full border-rose-200/70 bg-rose-50/70 text-xs text-rose-700 backdrop-blur hover:bg-rose-100"
          onClick={() => onSelect(action)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
