import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin';

type RouteParams = { id: string };
type RouteContext = { params: Promise<RouteParams> };

export async function PUT(req: Request, context: RouteContext) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, email, role } = body;

    // Safety: Prevent active admin from downgrading their own role
    if (id === adminCheck.userId && role && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bạn không thể tự hạ cấp quyền quản trị của chính mình.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
        role: role !== undefined ? role : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Không thể cập nhật thông tin người dùng.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await context.params;

    // Safety: Prevent active admin from deleting their own account
    if (id === adminCheck.userId) {
      return NextResponse.json({ error: 'Bạn không thể xóa tài khoản quản trị đang đăng nhập của chính mình.' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Người dùng đã bị xóa.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Không thể xóa người dùng.' }, { status: 500 });
  }
}
