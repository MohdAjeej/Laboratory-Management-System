import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/lib/permissions';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { cookies } from 'next/headers';

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic';

export default async function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force dynamic rendering by accessing cookies
  await cookies();
  
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  if (user.role !== UserRole.TECHNICIAN) {
    redirect('/dashboard');
  }

  return (
    <RoleBasedLayout user={user} role={UserRole.TECHNICIAN}>
      {children}
    </RoleBasedLayout>
  );
}