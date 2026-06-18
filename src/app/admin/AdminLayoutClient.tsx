'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BookText,
  Map,
  Headphones,
  LogOut,
  Home,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatar?: string | null;
  };
}

export function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    {
      title: 'Tổng quan',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Quản lý Tài khoản',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Quản lý Từ vựng',
      href: '/admin/vocab',
      icon: BookOpen,
    },
    {
      title: 'Quản lý Ngữ pháp',
      href: '/admin/grammar',
      icon: BookText,
    },
    {
      title: 'Lộ trình Học tập',
      href: '/admin/roadmaps',
      icon: Map,
    },
    {
      title: 'Quản lý Bài hát',
      href: '/admin/music',
      icon: Headphones,
    },
  ];

  const userName = user.name || 'Admin';
  const userEmail = user.email || 'admin@myelts.com';
  const userAvatar = user.avatar || user.image || '';
  const avatarFallback = userName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <div className="flex min-h-screen bg-[#FFF7FB] text-[#3A3A3A] dark:bg-[#1a1517] dark:text-gray-100">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-20 flex flex-col border-r border-[#F3D1E4] bg-white transition-all duration-300 dark:border-gray-800 dark:bg-[#161214]',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#F3D1E4] px-4 dark:border-gray-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 text-white font-bold text-lg">
              E
            </span>
            {isSidebarOpen && (
              <span className="font-semibold text-lg bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent truncate">
                MyELTS Admin
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex h-8 w-8 hover:bg-pink-50 dark:hover:bg-gray-800"
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', isSidebarOpen ? 'rotate-180' : '')} />
          </Button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-gradient-to-r from-pink-100 to-pink-200/50 text-pink-600 dark:from-pink-950 dark:to-pink-900/20 dark:text-pink-400'
                    : 'text-[#6B6B6B] hover:bg-pink-50 hover:text-pink-500 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-pink-400'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform group-hover:scale-110',
                    isActive ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 group-hover:text-pink-500'
                  )}
                />
                {isSidebarOpen && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[#F3D1E4] p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-pink-200">
              <AvatarImage src={userAvatar} alt={userName} className="object-cover" />
              <AvatarFallback className="bg-pink-100 text-pink-600">{avatarFallback}</AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{userName}</p>
                <p className="truncate text-[10px] text-gray-400">{userEmail}</p>
              </div>
            )}
          </div>
          {isSidebarOpen ? (
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
                className="w-full justify-start text-xs border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 dark:border-pink-950 dark:text-pink-400 dark:hover:bg-pink-950/20"
              >
                <Home className="mr-2 h-3.5 w-3.5" />
                Về trang chủ
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Đăng xuất
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                title="Về trang chủ"
                className="h-8 w-8 text-pink-600 hover:bg-pink-50"
              >
                <Home className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Đăng xuất"
                className="h-8 w-8 text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
        )}
      >
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-[#F3D1E4] bg-white px-4 md:hidden dark:border-gray-800 dark:bg-[#161214]">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 text-white font-bold">
              E
            </span>
            <span className="font-semibold text-base bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
              MyELTS Admin
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-9 w-9 text-gray-500"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {/* Mobile Navigation Dropdown */}
        {isSidebarOpen && (
          <div className="border-b border-[#F3D1E4] bg-white py-2 px-4 md:hidden animate-in slide-in-from-top duration-200 dark:border-gray-800 dark:bg-[#161214]">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-pink-50 text-pink-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-pink-600' : 'text-gray-400')} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </nav>
          </div>
        )}

        {/* Viewport content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
