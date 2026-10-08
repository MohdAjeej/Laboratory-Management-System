'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FlaskConical, 
  LayoutDashboard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/permissions';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

interface NavigationItem {
  name: string;
  href: string;
}

interface RoleBasedSidebarProps {
  user: User;
  role: UserRole;
  navigation: NavigationItem[];
  roleDisplayName: string;
}

export default function RoleBasedSidebar({ 
  user, 
  role, 
  navigation, 
  roleDisplayName 
}: RoleBasedSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/dashboard' || href.endsWith('/dashboard')) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      [UserRole.ADMIN]: 'text-red-600',
      [UserRole.LAB_ADMIN]: 'text-purple-600',
      [UserRole.RECEPTIONIST]: 'text-blue-600',
      [UserRole.TECHNICIAN]: 'text-green-600',
      [UserRole.PATHOLOGIST]: 'text-orange-600',
      [UserRole.ACCOUNTANT]: 'text-yellow-600',
      [UserRole.HOSPITAL_STAFF]: 'text-gray-600',
      [UserRole.PATIENT]: 'text-cyan-600',
    };
    return colors[role] || 'text-blue-600';
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={toggleMobile}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white border-r border-gray-200 flex flex-col
        transition-all duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center">
              <FlaskConical className={`h-8 w-8 ${getRoleColor(role)}`} />
              <div className="ml-2">
                <h1 className="text-lg font-bold text-gray-900">LIMS</h1>
                <p className={`text-xs ${getRoleColor(role)}`}>{roleDisplayName}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <FlaskConical className={`h-8 w-8 ${getRoleColor(role)} mx-auto`} />
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="hidden lg:flex h-6 w-6 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  transition-colors duration-150 ease-in-out
                  ${isActive(item.href)
                    ? `bg-${getRoleColor(role).split('-')[1]}-100 ${getRoleColor(role)} border-r-2 border-${getRoleColor(role).split('-')[1]}-600`
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <LayoutDashboard className={`
                  ${isCollapsed ? 'mx-auto' : 'mr-3'} 
                  h-5 w-5 flex-shrink-0
                  ${isActive(item.href) ? getRoleColor(role) : 'text-gray-500'}
                  group-hover:text-gray-600
                `} />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-2">
            <div className={`
              flex items-center px-3 py-2 text-sm rounded-md
              ${isCollapsed ? 'justify-center' : ''}
            `}>
              <User className={`
                ${isCollapsed ? '' : 'mr-3'} 
                h-5 w-5 flex-shrink-0 text-gray-500
              `} />
              {!isCollapsed && (
                <div className="truncate">
                  <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              )}
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className={`
                  w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  text-gray-700 hover:bg-red-50 hover:text-red-700
                  transition-colors duration-150 ease-in-out
                `}
                title={isCollapsed ? 'Logout' : undefined}
              >
                <LogOut className={`
                  ${isCollapsed ? 'mx-auto' : 'mr-3'} 
                  h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-red-600
                `} />
                {!isCollapsed && <span>Logout</span>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}