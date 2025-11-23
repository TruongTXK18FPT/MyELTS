import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

type ChatMessageBubbleProps = {
  isFromUser: boolean;
  message: string;
  timestamp: string;
  avatarUrl?: string;
  avatarHint?: string;
};

export function ChatMessageBubble({ isFromUser, message, timestamp, avatarUrl, avatarHint }: ChatMessageBubbleProps) {
  return (
    <div className={cn('flex items-end gap-3', isFromUser && 'justify-end')}>
      {!isFromUser && (
        <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="AI Tutor" data-ai-hint={avatarHint} />}
            <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-md rounded-2xl p-3.5',
          isFromUser
            ? 'rounded-br-lg bg-primary text-white'
            : 'rounded-bl-lg bg-white text-text-main shadow-sm'
        )}
      >
        <p className="text-sm">{message}</p>
      </div>
       {isFromUser && (
        <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="User" data-ai-hint={avatarHint} />}
            <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
