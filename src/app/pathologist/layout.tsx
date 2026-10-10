import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/permissions';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';

export const dynamic = 'force-dynamic';

export default async function PathologistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await cookies();
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (user.role !== UserRole.PATHOLOGIST && user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <RoleBasedLayout user={user as any} role={UserRole.PATHOLOGIST}>
      {children}
    </RoleBasedLayout>
  );
}
