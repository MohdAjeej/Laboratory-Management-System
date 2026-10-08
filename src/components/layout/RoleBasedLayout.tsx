'use client';

import { ReactNode } from 'react';
import { UserRole } from '@/lib/permissions';
import { getRoleNavigation, getRoleDisplayName } from '@/lib/routing';
import RoleBasedSidebar from '@/components/layout/RoleBasedSidebar';
import RoleBasedHeader from '@/components/layout/RoleBasedHeader';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  _id: string;
}

interface RoleBasedLayoutProps {
  user: User;
  role: UserRole;
  children: ReactNode;
}

export default function RoleBasedLayout({ user, role, children }: RoleBasedLayoutProps) {
  const navigation = getRoleNavigation(role);
  const roleDisplayName = getRoleDisplayName(role);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        <RoleBasedSidebar
          user={user}
          role={role}
          navigation={navigation}
          roleDisplayName={roleDisplayName}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <RoleBasedHeader user={user} roleDisplayName={roleDisplayName} />
          
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}