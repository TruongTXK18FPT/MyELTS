import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary to-background p-4">
      <Card className="w-full max-w-md shadow-2xl shadow-primary/10">
        <CardHeader className="text-center space-y-4">
          <GraduationCap className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-3xl">Tạo tài khoản MyELTS</CardTitle>
          <CardDescription>Bắt đầu hành trình chinh phục IELTS của bạn ngay hôm nay.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <Input
              id="name"
              name="name"
              type="text"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              required
            />
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
             <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              label="Xác nhận mật khẩu"
              placeholder="••••••••"
              required
            />
            <Button type="submit" className="w-full rounded-full text-base py-6" size="lg">
              Tạo tài khoản
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-text-muted">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
