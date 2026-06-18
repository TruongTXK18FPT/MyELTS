import { auth } from '@/auth';

export async function verifyAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Bạn cần đăng nhập.', status: 401 };
  }
  if (session.user.role !== 'ADMIN') {
    return { error: 'Bạn không có quyền truy cập chức năng này.', status: 403 };
  }
  return { userId: session.user.id, session };
}
