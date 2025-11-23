import { RoadmapWeekCard } from './RoadmapWeekCard';

const phases = [
  {
    name: 'Phase 1: Foundation (Weeks 1-4)',
    goal: 'Xây dựng nền tảng từ vựng, ngữ pháp và làm quen với các dạng bài thi.',
    weeks: [
      {
        week: 1,
        tasks: [
          { description: 'Học 50 từ vựng chủ đề Education', completed: true },
          { description: 'Làm 1 bài Reading (General Training)', completed: true },
          { description: 'Viết 1 bài Writing Task 1 (Line Graph)', completed: false },
          { description: 'Luyện Speaking Part 1 (15 phút)', completed: false },
        ],
      },
      {
        week: 2,
        tasks: [
          { description: 'Học 50 từ vựng chủ đề Health', completed: false },
          { description: 'Làm 1 bài Listening', completed: false },
          { description: 'Viết 1 bài Writing Task 2 (Opinion Essay)', completed: false },
        ],
      },
    ],
  },
    {
    name: 'Phase 2: Skill Development (Weeks 5-8)',
    goal: 'Tập trung cải thiện điểm yếu và nâng cao kỹ năng làm bài.',
    weeks: [
      {
        week: 5,
        tasks: [
          { description: 'Học 70 từ vựng chủ đề Technology (band 6.5+)', completed: false },
          { description: 'Làm 1 bài full Reading Test (Academic)', completed: false },
        ],
      },
    ],
  },
];

export function RoadmapTimeline() {
  return (
    <div className="space-y-12">
      {phases.map((phase, index) => (
        <div key={index}>
          <div className="mb-6">
            <h3 className="font-headline text-2xl font-semibold text-text-main">{phase.name}</h3>
            <p className="text-text-muted">{phase.goal}</p>
          </div>
          <div className="space-y-6">
            {phase.weeks.map((week) => (
              <RoadmapWeekCard key={week.week} weekNumber={week.week} tasks={week.tasks} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
