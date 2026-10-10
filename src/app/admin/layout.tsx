import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/lib/permissions';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { cookies } from 'next/headers';

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force dynamic rendering by accessing cookies
  await cookies();
  
  // Check authentication and authorization
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Allow ADMIN, LAB_ADMIN, RECEPTIONIST, TECHNICIAN, PATHOLOGIST, and ACCOUNTANT
  const allowedRoles = [
    UserRole.ADMIN,
    UserRole.LAB_ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.TECHNICIAN,
    UserRole.PATHOLOGIST,
    UserRole.ACCOUNTANT
  ];
  
  if (!allowedRoles.includes(user.role as UserRole)) {
    // Hospital staff and patients go to their own panels
    if (user.role === UserRole.HOSPITAL_STAFF) {
      redirect('/hospital/dashboard');
    } else if (user.role === UserRole.PATIENT) {
      redirect('/patient/dashboard');
    } else {
      redirect('/login');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar userRole={user.role as UserRole} />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <AdminHeader user={user} />
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}