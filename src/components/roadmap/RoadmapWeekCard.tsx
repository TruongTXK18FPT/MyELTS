import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Task = {
  description: string;
  completed: boolean;
};

type RoadmapWeekCardProps = {
  weekNumber: number;
  tasks: Task[];
};

export function RoadmapWeekCard({ weekNumber, tasks }: RoadmapWeekCardProps) {
  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = (completedTasks / tasks.length) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-secondary/50">
        <CardTitle className="text-lg">Tuần {weekNumber}</CardTitle>
        <div className="text-sm font-medium text-text-muted">
          {completedTasks}/{tasks.length} hoàn thành
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ul className="space-y-4">
          {tasks.map((task, index) => (
            <li key={index} className="flex items-center">
              <Checkbox id={`task-${weekNumber}-${index}`} checked={task.completed} />
              <Label htmlFor={`task-${weekNumber}-${index}`} className="ml-3 text-sm text-text-main data-[completed=true]:line-through" data-completed={task.completed}>
                {task.description}
              </Label>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="bg-secondary/50">
        <Button variant="link" className="p-0 h-auto">
          Đi tới bài học
        </Button>
      </CardFooter>
    </Card>
  );
}
