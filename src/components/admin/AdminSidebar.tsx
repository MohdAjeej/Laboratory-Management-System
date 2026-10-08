'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FlaskConical, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Hospital, 
  Stethoscope, 
  TestTube, 
  Package, 
  FileText, 
  Microscope, 
  BarChart3, 
  DollarSign, 
  Archive, 
  Wrench, 
  Shield, 
  Bell, 
  TrendingUp, 
  FileSearch, 
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SidebarSection {
  name: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    name: 'User Management',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Staff', href: '/admin/staff', icon: UserCheck },
    ],
  },
  {
    name: 'Healthcare Network',
    items: [
      { name: 'Patients', href: '/admin/patients', icon: Users },
      { name: 'Hospitals', href: '/admin/hospitals', icon: Hospital },
      { name: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
    ],
  },
  {
    name: 'Laboratory Operations',
    items: [
      { name: 'Tests', href: '/admin/tests', icon: TestTube },
      { name: 'Packages', href: '/admin/packages', icon: Package },
      { name: 'Orders', href: '/admin/orders', icon: FileText },
      { name: 'Samples', href: '/admin/samples', icon: Microscope },
      { name: 'Results', href: '/admin/results', icon: BarChart3 },
      { name: 'Reports', href: '/admin/reports', icon: FileSearch },
    ],
  },
  {
    name: 'Finance & Operations',
    items: [
      { name: 'Billing', href: '/admin/billing', icon: DollarSign },
      { name: 'Inventory', href: '/admin/inventory', icon: Archive },
      { name: 'Equipment', href: '/admin/equipment', icon: Wrench },
    ],
  },
  {
    name: 'Quality & Compliance',
    items: [
      { name: 'Quality Control', href: '/admin/quality-control', icon: Shield },
      { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileSearch },
    ],
  },
  {
    name: 'Analytics & Insights',
    items: [
      { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    name: 'System',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
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
              <FlaskConical className="h-8 w-8 text-blue-600" />
              <div className="ml-2">
                <h1 className="text-lg font-bold text-gray-900">LIMS</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <FlaskConical className="h-8 w-8 text-blue-600 mx-auto" />
          )}
          
          {/* Collapse toggle - only on desktop */}
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
          <div className="space-y-6">
            {sidebarSections.map((section, sectionIndex) => (
              <div key={section.name}>
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.name}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md
                        transition-colors duration-150 ease-in-out
                        ${isActive(item.href)
                          ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className={`
                        ${isCollapsed ? 'mx-auto' : 'mr-3'} 
                        h-5 w-5 flex-shrink-0
                        ${isActive(item.href) ? 'text-blue-600' : 'text-gray-500'}
                        group-hover:text-gray-600
                      `} />
                      {!isCollapsed && (
                        <>
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto inline-block bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-2">
            <Link
              href="/admin/profile"
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md
                text-gray-700 hover:bg-gray-100 hover:text-gray-900
                transition-colors duration-150 ease-in-out
              `}
              title={isCollapsed ? 'Admin Profile' : undefined}
            >
              <User className={`
                ${isCollapsed ? 'mx-auto' : 'mr-3'} 
                h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-600
              `} />
              {!isCollapsed && <span>Admin Profile</span>}
            </Link>

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