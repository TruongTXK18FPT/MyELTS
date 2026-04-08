'use client';

import { cn } from '@/lib/utils';

type TutorAvatarProps = {
  name: string;
  emoji: string;
  accent: string;
  isOnline?: boolean;
  isTyping?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses: Record<NonNullable<TutorAvatarProps['size']>, string> = {
  sm: 'h-10 w-10 text-xl',
  md: 'h-14 w-14 text-2xl',
  lg: 'h-20 w-20 text-4xl',
};

export function TutorAvatar({
  name,
  emoji,
  accent,
  isOnline = true,
  isTyping = false,
  size = 'md',
}: TutorAvatarProps) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className={cn(
          'relative rounded-full p-[2px] shadow-lg transition-all',
          isTyping && 'animate-ai-pulse-glow',
          sizeClasses[size]
        )}
        style={{
          backgroundImage: `linear-gradient(135deg, ${accent}, #ffffff)`,
        }}
        title={name}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white/85 backdrop-blur-md">
          <span aria-hidden>{emoji}</span>
          <span className="sr-only">{name}</span>
        </div>
      </div>

      {isOnline && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-rose-400" />}
    </div>
  );
}
