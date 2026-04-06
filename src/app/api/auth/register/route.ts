import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email và password là bắt buộc" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email này đã được sử dụng" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    return NextResponse.json({ message: "Đăng ký thành công", user: { email: user.email, name: user.name } }, { status: 201 });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    return NextResponse.json({ message: "Đã có lỗi xảy ra s" }, { status: 500 });
  }
}
