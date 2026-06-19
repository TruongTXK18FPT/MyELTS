'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, LogOut, UserCircle2, Map, Home, BookOpen, PenTool, MessageSquare, LayoutDashboard, BookText, Headphones, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import icons for header
import logoImg from '@/assets/logo.png';

const navLinks = [
  { href: '/workspace', label: 'Workspace', isLucide: true, LucideIcon: Sparkles },
  { href: '/music', label: 'Music', isLucide: true, LucideIcon: Headphones },
  { href: '/vocabulary', label: 'Vocabulary', isLucide: true, LucideIcon: BookOpen },
  { href: '/grammar', label: 'Grammar', isLucide: true, LucideIcon: BookText },
  { href: '/tests', label: 'Tests', isLucide: true, LucideIcon: PenTool },
  { href: '/ai-chat', label: 'AI Chat', isLucide: true, LucideIcon: MessageSquare },
  { href: '/roadmap', label: 'Roadmap', isLucide: true, LucideIcon: Map },
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
        'flex items-center gap-6',
        isMobile ? 'flex-col items-start gap-4 pt-8' : 'hidden lg:flex'
      )}
    >
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'flex items-center gap-2 text-sm font-semibold transition-all hover:text-primary-dark hover:scale-105',
            pathname === link.href ? 'text-primary-dark' : 'text-text-muted'
          )}
        >
          <link.LucideIcon className="h-6 w-6 text-primary drop-shadow-sm" />
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
          <Image
            src={logoImg}
            alt="MyELTS Logo"
            width={48}
            height={48}
            style={{ width: '48px', height: 'auto' }}
            className="object-contain drop-shadow-md"
          />
          <span className="font-headline text-3xl font-extrabold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            MyELTS
          </span>
        </Link>

        {renderNavLinks(false)}

        <div className="hidden items-center gap-2 lg:flex">
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
                {session.user.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <LayoutDashboard className="h-4 w-4 text-pink-500" />
                      Trang Quản trị
                    </Link>
                  </DropdownMenuItem>
                )}
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

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Menu Điều Hướng</SheetTitle>
              <div className="flex flex-col gap-8">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                      src={logoImg}
                      alt="MyELTS Logo"
                      width={48}
                      height={48}
                      style={{ width: '48px', height: 'auto' }}
                      className="object-contain drop-shadow-md"
                    />
                    <span className="font-headline text-3xl font-extrabold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
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

                    {session.user.role === 'ADMIN' && (
                      <Button variant="outline" asChild className="w-full justify-start border-pink-200 text-pink-600 hover:bg-pink-50">
                        <Link href="/admin">
                          <LayoutDashboard className="h-4 w-4" />
                          Trang Quản trị
                        </Link>
                      </Button>
                    )}
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
