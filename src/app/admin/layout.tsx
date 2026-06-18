import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminLayoutClient } from './AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Guard: Ensure user is logged in and is an ADMIN
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <AdminLayoutClient user={session.user}>
      {children}
    </AdminLayoutClient>
  );
}
