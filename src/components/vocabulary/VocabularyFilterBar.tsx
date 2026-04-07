'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ChipFilter } from '@/components/ui/ChipFilter';
import { Search } from 'lucide-react';

const topics = ['Giáo dục', 'Môi trường', 'Công nghệ', 'Sức khỏe', 'Công việc'];
const bands = ['4.0-5.0', '5.5-6.5', '7.0+'];
const sorts = ['A-Z', 'Z-A', 'Độ khó'];

export function VocabularyFilterBar() {
  const [activeTopic, setActiveTopic] = useState('Giáo dục');
  const [activeBand, setActiveBand] = useState('5.5-6.5');
  const [activeSort, setActiveSort] = useState('A-Z');

  return (
    <div className="my-8 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Tìm kiếm từ vựng..." className="pl-10" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-text-muted mr-2">Chủ đề:</span>
        {topics.map((topic) => (
          <ChipFilter
            key={topic}
            label={topic}
            isActive={activeTopic === topic}
            onClick={() => setActiveTopic(topic)}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-text-muted mr-2">Trình độ:</span>
        {bands.map((band) => (
          <ChipFilter
            key={band}
            label={band}
            isActive={activeBand === band}
            onClick={() => setActiveBand(band)}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
         <span className="text-sm font-medium text-text-muted mr-2">Sắp xếp:</span>
        {sorts.map((sort) => (
          <ChipFilter
            key={sort}
            label={sort}
            isActive={activeSort === sort}
            onClick={() => setActiveSort(sort)}
          />
        ))}
      </div>
    </div>
  );
}
