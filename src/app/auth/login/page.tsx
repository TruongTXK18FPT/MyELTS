import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary to-background p-4">
      <Card className="w-full max-w-md shadow-2xl shadow-primary/10">
        <CardHeader className="text-center space-y-4">
            <GraduationCap className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-3xl">Đăng nhập MyELTS</CardTitle>
          <CardDescription>Chào mừng bạn quay trở lại!</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Mật khẩu"
              placeholder="••••••••"
              required
            />
            <div className="flex items-center justify-between">
              <Input
                id="remember"
                name="remember"
                type="checkbox"
                label="Nhớ tài khoản"
                className="w-auto"
              />
              <Link href="#" className="text-sm text-primary hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <Button type="submit" className="w-full rounded-full text-base py-6" size="lg">
              Đăng nhập
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-text-muted">
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" className="font-semibold text-primary hover:underline">
              Đăng ký
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
