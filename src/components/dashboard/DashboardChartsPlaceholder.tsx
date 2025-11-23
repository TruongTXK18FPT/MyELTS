'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from 'recharts';

const chartData = [
  { month: 'Jan', reading: 6.0, writing: 5.5, overall: 5.5 },
  { month: 'Feb', reading: 6.0, writing: 6.0, overall: 6.0 },
  { month: 'Mar', reading: 6.5, writing: 6.0, overall: 6.0 },
  { month: 'Apr', reading: 6.5, writing: 6.5, overall: 6.5 },
  { month: 'May', reading: 7.0, writing: 6.5, overall: 6.5 },
];

const chartConfig = {
  overall: { label: 'Overall', color: 'hsl(var(--primary-dark))' },
  reading: { label: 'Reading', color: 'hsl(var(--primary))' },
  writing: { label: 'Writing', color: 'hsl(var(--accent))' },
};


export function DashboardChartsPlaceholder() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tiến bộ điểm số theo thời gian</CardTitle>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis domain={[5, 9]} tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line dataKey="reading" type="monotone" stroke={chartConfig.reading.color} strokeWidth={2} dot={false} />
                    <Line dataKey="writing" type="monotone" stroke={chartConfig.writing.color} strokeWidth={2} dot={false} />
                    <Line dataKey="overall" type="monotone" stroke={chartConfig.overall.color} strokeWidth={3} dot={false} />
                </LineChart>
            </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Phân bố kỹ năng</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={[{ name: 'Scores', ...chartData[chartData.length-1] }]}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[0, 9]} tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="reading" fill={chartConfig.reading.color} radius={4} />
                <Bar dataKey="writing" fill={chartConfig.writing.color} radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
