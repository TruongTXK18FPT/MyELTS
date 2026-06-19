"use client";

import { Header } from './Header';
import { Footer } from './Footer';
import { MusicRobot } from '@/components/music/MusicRobot';
import { usePathname } from 'next/navigation';

type MainLayoutProps = {
  children: React.ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isWorkspaceRoute = pathname.startsWith('/workspace');
  const hideFooter = pathname.startsWith('/ai-chat') || isAdminRoute || isWorkspaceRoute;

  if (isAdminRoute || isWorkspaceRoute) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter ? <Footer /> : null}
      <MusicRobot />
    </div>
  );
}

