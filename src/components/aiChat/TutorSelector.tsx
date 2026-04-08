'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TUTOR_CARDS, type TutorDomain } from '@/lib/tutor-client';
import type { TutorType } from '@/lib/chat-utils';
import { TutorAvatar } from './TutorAvatar';

type TutorSelectorProps = {
  selectedTutor: TutorType;
  compact?: boolean;
  onSelectTutor: (tutor: TutorType) => void;
};

const DOMAIN_LABELS: Record<TutorDomain, string> = {
  WRITING: 'Writing',
  LISTENING: 'Listening',
  SPEAKING: 'Speaking',
  READING: 'Reading',
};

const orderedDomains: TutorDomain[] = ['WRITING', 'LISTENING', 'SPEAKING', 'READING'];

export function TutorSelector({ selectedTutor, compact = false, onSelectTutor }: TutorSelectorProps) {
  return (
    <div className="space-y-4">
      {orderedDomains.map((domain) => {
        const tutors = TUTOR_CARDS.filter((item) => item.domain === domain);
        if (tutors.length === 0) {
          return null;
        }

        return (
          <section key={domain} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">{DOMAIN_LABELS[domain]}</h3>
              <Badge variant="secondary" className="bg-rose-100/70 text-[10px] text-rose-700">
                {tutors.length} tutor
              </Badge>
            </div>

            <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
              {tutors.map((tutor) => {
                const isActive = tutor.type === selectedTutor;

                return (
                  <button
                    key={tutor.type}
                    type="button"
                    onClick={() => onSelectTutor(tutor.type)}
                    className={cn(
                      'group rounded-2xl border p-3 text-left transition-all duration-300',
                      'bg-white/65 backdrop-blur-md hover:-translate-y-0.5 hover:bg-rose-50/85',
                      isActive
                        ? 'border-rose-300 ring-2 ring-rose-200 ring-offset-0 shadow-xl shadow-rose-200/70'
                        : 'border-rose-100/70 shadow-lg shadow-rose-200/20'
                    )}
                    style={{
                      boxShadow: isActive ? `0 8px 24px -10px ${tutor.accent}` : undefined,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <TutorAvatar name={tutor.name} emoji={tutor.emoji} accent={tutor.accent} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-rose-900">{tutor.name}</p>
                        <p className="text-xs font-medium text-rose-700">{tutor.subtitle}</p>
                        {!compact && <p className="mt-1 line-clamp-2 text-xs text-rose-600">{tutor.description}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
