'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer } from '@/components/ui/chart';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

type EssayEvaluationCardProps = {
  metadata: Record<string, unknown> | null;
};

type ScoreItem = {
  key: string;
  label: string;
  value: number;
};

function toNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(9, parsed));
}

function readScores(metadata: Record<string, unknown> | null): ScoreItem[] {
  return [
    { key: 'TA', label: 'TA/TR', value: toNumber(metadata?.TA || metadata?.TR) },
    { key: 'CC', label: 'CC', value: toNumber(metadata?.CC) },
    { key: 'LR', label: 'LR', value: toNumber(metadata?.LR) },
    { key: 'GRA', label: 'GRA', value: toNumber(metadata?.GRA) },
  ];
}

export function EssayEvaluationCard({ metadata }: EssayEvaluationCardProps) {
  const scores = readScores(metadata);
  const overall =
    toNumber(metadata?.overall) ||
    Number((scores.reduce((sum, item) => sum + item.value, 0) / Math.max(scores.length, 1)).toFixed(1));

  const highlights = Array.isArray(metadata?.highlights)
    ? (metadata?.highlights as unknown[])
        .filter((item): item is string => typeof item === 'string')
        .slice(0, 4)
    : [];

  return (
    <Card className="border-white/30 bg-white/70 shadow-xl backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Essay Evaluation</CardTitle>
          <Badge className="bg-emerald-500 text-white">Overall {overall.toFixed(1)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer
          className="mx-auto h-52 w-full max-w-sm"
          config={{
            score: {
              label: 'Band',
              color: '#f97316',
            },
          }}
        >
          <RadarChart data={scores}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
            <Radar dataKey="value" fill="var(--color-score)" fillOpacity={0.32} stroke="var(--color-score)" />
          </RadarChart>
        </ChartContainer>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {scores.map((item) => (
            <div key={item.key} className="rounded-xl border border-orange-100 bg-orange-50/80 px-3 py-2">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-base font-semibold text-orange-700">{item.value.toFixed(1)}</p>
            </div>
          ))}
        </div>

        {highlights.length > 0 && (
          <div className="space-y-1.5 text-sm">
            <p className="font-semibold">Priority Fixes</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {highlights.map((highlight, index) => (
                <li key={`${highlight}-${index}`}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
