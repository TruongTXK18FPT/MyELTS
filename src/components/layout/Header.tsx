'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/vocabulary', label: 'Vocabulary' },
  { href: '/tests', label: 'Tests' },
  { href: '/ai-chat', label: 'AI Chat' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Header() {
  const pathname = usePathname();

  const renderNavLinks = (isMobile: boolean) => (
    <nav
      className={cn(
        'flex items-center gap-4',
        isMobile ? 'flex-col items-start gap-4 pt-8' : 'hidden md:flex'
      )}
    >
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary-dark',
            pathname === link.href ? 'text-primary-dark' : 'text-text-muted'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="font-headline text-xl font-bold text-text-main">
            MyELTS
          </span>
        </Link>

        {renderNavLinks(false)}

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Đăng nhập</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-primary to-primary-dark text-white"
          >
            <Link href="/auth/register">Đăng ký</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-8">
                <Link href="/" className="flex items-center gap-2">
                    <GraduationCap className="h-7 w-7 text-primary" />
                    <span className="font-headline text-xl font-bold text-text-main">
                        MyELTS
                    </span>
                </Link>
                {renderNavLinks(true)}
                <div className="mt-4 flex flex-col gap-2">
                <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/auth/login">Đăng nhập</Link>
                </Button>
                <Button asChild className="w-full rounded-full bg-gradient-to-r from-primary to-primary-dark text-white">
                    <Link href="/auth/register">Đăng ký</Link>
                </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
