import { UserRole } from '@/lib/permissions';

/**
 * Get the appropriate dashboard route based on user role
 */
export function getDashboardRoute(role: UserRole): string {
  const roleRoutes: Record<UserRole, string> = {
    [UserRole.ADMIN]: '/admin',
    [UserRole.LAB_ADMIN]: '/dashboard',
    [UserRole.RECEPTIONIST]: '/receptionist/dashboard',
    [UserRole.TECHNICIAN]: '/technician/dashboard',
    [UserRole.PATHOLOGIST]: '/pathologist/dashboard',
    [UserRole.ACCOUNTANT]: '/accountant/dashboard',
    [UserRole.HOSPITAL_STAFF]: '/hospital/dashboard',
    [UserRole.PATIENT]: '/patient/dashboard',
  };

  return roleRoutes[role] || '/dashboard';
}

/**
 * Check if a user has access to a specific route based on their role
 */
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Admin can access all routes
  if (userRole === UserRole.ADMIN) {
    return true;
  }

  // Define route access patterns
  const routePatterns: Record<string, UserRole[]> = {
    '/admin': [UserRole.ADMIN],
    '/dashboard': [
      UserRole.LAB_ADMIN,
      UserRole.RECEPTIONIST,
      UserRole.TECHNICIAN,
      UserRole.PATHOLOGIST,
      UserRole.ACCOUNTANT,
      UserRole.HOSPITAL_STAFF,
    ],
    '/receptionist': [UserRole.RECEPTIONIST],
    '/technician': [UserRole.TECHNICIAN],
    '/pathologist': [UserRole.PATHOLOGIST],
    '/accountant': [UserRole.ACCOUNTANT],
    '/hospital': [UserRole.HOSPITAL_STAFF],
    '/patient': [UserRole.PATIENT],
  };

  // Check if route starts with any pattern the user has access to
  for (const [pattern, allowedRoles] of Object.entries(routePatterns)) {
    if (route.startsWith(pattern) && allowedRoles.includes(userRole)) {
      return true;
    }
  }

  return false;
}

/**
 * Get user-friendly role name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.LAB_ADMIN]: 'Laboratory Administrator',
    [UserRole.RECEPTIONIST]: 'Receptionist',
    [UserRole.TECHNICIAN]: 'Laboratory Technician',
    [UserRole.PATHOLOGIST]: 'Pathologist',
    [UserRole.ACCOUNTANT]: 'Accountant',
    [UserRole.HOSPITAL_STAFF]: 'Hospital Staff',
    [UserRole.PATIENT]: 'Patient',
  };

  return roleNames[role] || role;
}

/**
 * Get role-specific navigation items
 */
export function getRoleNavigation(role: UserRole): Array<{ name: string; href: string; icon?: string }> {
  const baseNavigation = [
    { name: 'Dashboard', href: getDashboardRoute(role) },
  ];

  const roleSpecificNavigation: Record<UserRole, Array<{ name: string; href: string }>> = {
    [UserRole.ADMIN]: [
      { name: 'Dashboard', href: '/admin' },
      { name: 'Users', href: '/admin/users' },
      { name: 'Hospitals', href: '/admin/hospitals' },
      { name: 'Analytics', href: '/admin/analytics' },
      { name: 'Settings', href: '/admin/settings' },
    ],
    [UserRole.LAB_ADMIN]: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Orders', href: '/orders' },
      { name: 'Samples', href: '/samples' },
      { name: 'Results', href: '/results' },
      { name: 'Reports', href: '/reports' },
      { name: 'Quality Control', href: '/qc' },
    ],
    [UserRole.RECEPTIONIST]: [
      { name: 'Dashboard', href: '/receptionist/dashboard' },
      { name: 'Patients', href: '/receptionist/patients' },
      { name: 'Orders', href: '/receptionist/orders' },
      { name: 'Billing', href: '/receptionist/billing' },
      { name: 'Appointments', href: '/receptionist/appointments' },
    ],
    [UserRole.TECHNICIAN]: [
      { name: 'Dashboard', href: '/technician/dashboard' },
      { name: 'Sample Collection', href: '/technician/collection' },
      { name: 'Testing', href: '/technician/testing' },
      { name: 'Results Entry', href: '/technician/results' },
      { name: 'Equipment', href: '/technician/equipment' },
    ],
    [UserRole.PATHOLOGIST]: [
      { name: 'Dashboard', href: '/pathologist/dashboard' },
      { name: 'Results Review', href: '/pathologist/results' },
      { name: 'Reports', href: '/pathologist/reports' },
      { name: 'Consultations', href: '/pathologist/consultations' },
    ],
    [UserRole.ACCOUNTANT]: [
      { name: 'Dashboard', href: '/accountant/dashboard' },
      { name: 'Billing', href: '/accountant/billing' },
      { name: 'Payments', href: '/accountant/payments' },
      { name: 'Financial Reports', href: '/accountant/reports' },
    ],
    [UserRole.HOSPITAL_STAFF]: [
      { name: 'Dashboard', href: '/hospital/dashboard' },
      { name: 'Patients', href: '/hospital/patients' },
      { name: 'Orders', href: '/hospital/orders' },
      { name: 'Reports', href: '/hospital/reports' },
    ],
    [UserRole.PATIENT]: [
      { name: 'Dashboard', href: '/patient/dashboard' },
      { name: 'My Orders', href: '/patient/orders' },
      { name: 'Test Results', href: '/patient/results' },
      { name: 'Reports', href: '/patient/reports' },
      { name: 'Profile', href: '/patient/profile' },
    ],
  };

  return roleSpecificNavigation[role] || baseNavigation;
}