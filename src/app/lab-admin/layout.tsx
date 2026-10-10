import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/lib/permissions';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function LabAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await cookies();
  
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  if (user.role !== UserRole.LAB_ADMIN) {
    redirect('/dashboard');
  }

  return (
    <RoleBasedLayout user={user} role={UserRole.LAB_ADMIN}>
      {children}
    </RoleBasedLayout>
  );
}
