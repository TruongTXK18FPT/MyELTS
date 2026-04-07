'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, GraduationCap, LogOut, UserCircle2 } from 'lucide-react';
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
  const { data: session } = useSession();

  const userName = session?.user?.name || 'Tài khoản';
  const userEmail = session?.user?.email || '';
  const userImage = session?.user?.image || '';
  const avatarFallback = userName.trim().charAt(0).toUpperCase() || 'U';

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
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 rounded-full px-2">
                  <Avatar className="h-8 w-8 border border-primary/30">
                    <AvatarImage src={userImage} alt={userName} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary-dark">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 hidden max-w-32 truncate text-sm font-medium lg:inline">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="space-y-1">
                  <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{userEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle2 className="h-4 w-4" />
                    Trang cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Đăng nhập</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-gradient-to-r from-primary to-primary-dark text-white"
              >
                <Link href="/auth/register">Đăng ký</Link>
              </Button>
            </>
          )}
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
                {session?.user ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-secondary/40 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-primary/30">
                        <AvatarImage src={userImage} alt={userName} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary-dark">
                          {avatarFallback}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                        <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                      </div>
                    </div>

                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link href="/profile">
                        <UserCircle2 className="h-4 w-4" />
                        Trang cá nhân
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2">
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/auth/login">Đăng nhập</Link>
                    </Button>
                    <Button asChild className="w-full rounded-full bg-gradient-to-r from-primary to-primary-dark text-white">
                      <Link href="/auth/register">Đăng ký</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
