'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  BookOpen,
  BookText,
  Map,
  Headphones,
  TrendingUp,
  UserPlus,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface StatsSummary {
  totalUsers: number;
  newUsersWeekly: number;
  totalVocabs: number;
  newVocabsWeekly: number;
  totalGrammar: number;
  totalRoadmaps: number;
  activeRoadmaps: number;
  totalMusicTracks: number;
}

interface ChartData {
  date: string;
  count: number;
}

interface BreakdownItem {
  name: string;
  value: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

interface DashboardData {
  summary: StatsSummary;
  breakdown: {
    usersByRole: BreakdownItem[];
    grammarByLevel: BreakdownItem[];
  };
  charts: {
    registrations: ChartData[];
  };
  recentUsers: RecentUser[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        throw new Error('Không thể lấy dữ liệu thống kê từ hệ thống.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const COLORS = ['#F48FB1', '#EC407A', '#FCE4EC', '#F8BBD0', '#FFB6C1'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hệ thống Quản trị</h1>
            <p className="text-sm text-muted-foreground">Đang tải thông số thống kê...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="h-[240px]">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500 font-medium">{error || 'Không tải được dữ liệu.'}</p>
        <Button onClick={fetchStats} className="bg-pink-500 text-white hover:bg-pink-600">
          <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
        </Button>
      </div>
    );
  }

  const { summary, charts, recentUsers } = data;

  const cardDetails = [
    {
      title: 'Tổng Tài khoản',
      value: summary.totalUsers,
      desc: `+${summary.newUsersWeekly} tài khoản mới tuần này`,
      icon: Users,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400',
    },
    {
      title: 'Kho Từ vựng',
      value: summary.totalVocabs,
      desc: `+${summary.newVocabsWeekly} từ mới thêm gần đây`,
      icon: BookOpen,
      color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20 dark:text-pink-400',
    },
    {
      title: 'Điểm Ngữ pháp',
      value: summary.totalGrammar,
      desc: 'Giáo trình IELTS Grammar hệ thống',
      icon: BookText,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400',
    },
    {
      title: 'Lộ trình IELTS',
      value: summary.totalRoadmaps,
      desc: `${summary.activeRoadmaps} lộ trình đang hoạt động`,
      icon: Map,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent">
            Hệ thống Quản trị MyELTS
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý từ vựng, ngữ pháp, thành viên, nhạc nền và lộ trình học tập của học viên.
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm" className="border-pink-200 text-pink-600 hover:bg-pink-50">
          <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cardDetails.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="border-[#F3D1E4] shadow-sm dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</CardTitle>
                <div className={`rounded-xl p-2 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-[#3A3A3A] dark:text-white">{card.value}</div>
                <p className="text-xs text-[#6B6B6B] dark:text-gray-400 mt-1">{card.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics charts & users list */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4 border-[#F3D1E4] shadow-sm dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white">
              <TrendingUp className="h-5 w-5 text-pink-500" />
              Lượng Đăng ký Tài khoản mới (7 ngày qua)
            </CardTitle>
            <CardDescription>Biểu đồ cập nhật số lượng học viên đăng ký mới mỗi ngày.</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.registrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F48FB1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F48FB1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#888' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #F3D1E4',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#EC407A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRegistrations)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent users */}
        <Card className="col-span-3 border-[#F3D1E4] shadow-sm dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white">
              <UserPlus className="h-5 w-5 text-pink-500" />
              Học viên Đăng ký Gần đây
            </CardTitle>
            <CardDescription>Danh sách tài khoản vừa đăng ký trên hệ thống.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-center text-gray-400 py-6">Không có đăng ký mới nào gần đây.</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 border-b border-[#FCE4EC] pb-3 last:border-0 last:pb-0 dark:border-gray-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-pink-600 font-bold dark:bg-pink-950/40 dark:text-pink-400">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {user.name || 'Học viên MyELTS'}
                      </p>
                      <p className="truncate text-xs text-gray-400">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        user.role === 'ADMIN' 
                          ? 'bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                      <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extra Widgets */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Grammar Breakdown */}
        <Card className="border-[#F3D1E4] shadow-sm dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800 dark:text-white">Thống kê Ngữ pháp theo trình độ</CardTitle>
            <CardDescription>Số lượng giáo trình ngữ pháp được chia theo band/level.</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            {data.breakdown.grammarByLevel.length === 0 ? (
              <p className="text-sm text-center text-gray-400 py-12">Không có dữ liệu ngữ pháp.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.breakdown.grammarByLevel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                  <XAxis dataKey="name" tickLine={false} style={{ fontSize: 11, fill: '#888' }} />
                  <YAxis tickLine={false} style={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#EC407A" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {data.breakdown.grammarByLevel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Utilities */}
        <Card className="border-[#F3D1E4] shadow-sm dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800 dark:text-white">Lối tắt thao tác nhanh</CardTitle>
            <CardDescription>Các liên kết điều hành hệ thống.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/users')}
              className="h-16 flex flex-col items-center justify-center gap-1 border-pink-100 text-pink-600 hover:bg-pink-50"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Quản lý Thành viên</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/vocab')}
              className="h-16 flex flex-col items-center justify-center gap-1 border-pink-100 text-pink-600 hover:bg-pink-50"
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Quản lý Từ vựng</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/grammar')}
              className="h-16 flex flex-col items-center justify-center gap-1 border-pink-100 text-pink-600 hover:bg-pink-50"
            >
              <BookText className="h-5 w-5" />
              <span className="text-xs">Quản lý Ngữ pháp</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/music')}
              className="h-16 flex flex-col items-center justify-center gap-1 border-pink-100 text-pink-600 hover:bg-pink-50"
            >
              <Headphones className="h-5 w-5" />
              <span className="text-xs">Quản lý Bài hát</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
