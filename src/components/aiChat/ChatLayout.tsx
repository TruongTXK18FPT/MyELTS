import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInputBar } from './ChatInputBar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const mockMessages = [
    { from: 'ai', text: 'Hello! How can I help you with your IELTS preparation today? You can ask me in English or Vietnamese.', timestamp: '10:30 AM' },
    { from: 'user', text: 'What is the difference between Task 1 and Task 2 in Writing?', timestamp: '10:31 AM' },
    { from: 'ai', text: 'Great question! Task 1 requires you to describe visual information (like a graph or chart) in at least 150 words. Task 2 is an essay of at least 250 words in response to a point of view, argument, or problem.', timestamp: '10:32 AM' },
];

const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');
const aiAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-2');


export function ChatLayout() {
  return (
    <Card className="mx-auto max-w-4xl shadow-2xl shadow-primary/10">
      <CardHeader className="text-center">
        <CardTitle>IELTS Chat AI</CardTitle>
        <CardDescription>Hỏi bất cứ điều gì về IELTS bằng Anh hoặc Việt</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[60vh] flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto rounded-lg bg-secondary/30 p-4 pr-6">
            {mockMessages.map((msg, index) => (
                <ChatMessageBubble
                    key={index}
                    isFromUser={msg.from === 'user'}
                    message={msg.text}
                    timestamp={msg.timestamp}
                    avatarUrl={msg.from === 'user' ? userAvatar?.imageUrl : aiAvatar?.imageUrl}
                    avatarHint={msg.from === 'user' ? userAvatar?.imageHint : aiAvatar?.imageHint}
                />
            ))}
          </div>
          <div className="mt-4">
            <ChatInputBar />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
