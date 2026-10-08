import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { UserRole, hasPermission, Permission } from '@/lib/permissions';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  hospitalId?: string;
}

export interface ApiAuthOptions {
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  allowSelf?: boolean;
}

/**
 * API Authentication wrapper for Next.js API routes
 */
export function requireAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, context: any) => Promise<NextResponse>,
  options: ApiAuthOptions = {}
) {
  return async (request: NextRequest, context: any = {}) => {
    try {
      // Get token from cookies
      const token = request.cookies.get('auth-token')?.value;

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify token
      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      const user: AuthenticatedUser = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
        hospitalId: payload.hospitalId,
      };

      // Check required roles
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const hasRequiredRole = options.requiredRoles.includes(user.role);
        
        // Check if accessing own data is allowed
        if (!hasRequiredRole && options.allowSelf && context.params?.id === user.userId) {
          // Allow access to own data
        } else if (!hasRequiredRole) {
          return NextResponse.json(
            { error: 'Insufficient role permissions' },
            { status: 403 }
          );
        }
      }

      // Check required permissions
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasRequiredPermissions = options.requiredPermissions.every(
          permission => hasPermission(user.role, permission)
        );
        
        if (!hasRequiredPermissions) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Call the handler
      return handler(request, user, context);
    } catch (error) {
      console.error('API Authentication error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Admin-only API protection
 */
export function requireAdmin(
  handler: (request: NextRequest, user: AuthenticatedUser, context: any) => Promise<NextResponse>
) {
  return requireAuth(handler, {
    requiredRoles: [UserRole.ADMIN],
  });
}

/**
 * Staff-level API protection
 */
export function requireStaff(
  handler: (request: NextRequest, user: AuthenticatedUser, context: any) => Promise<NextResponse>
) {
  return requireAuth(handler, {
    requiredRoles: [
      UserRole.ADMIN,
      UserRole.LAB_ADMIN,
      UserRole.RECEPTIONIST,
      UserRole.TECHNICIAN,
      UserRole.PATHOLOGIST,
      UserRole.ACCOUNTANT,
      UserRole.HOSPITAL_STAFF,
    ],
  });
}

/**
 * Any authenticated user API protection
 */
export function requireAuthenticated(
  handler: (request: NextRequest, user: AuthenticatedUser, context: any) => Promise<NextResponse>
) {
  return requireAuth(handler, {
    requiredRoles: Object.values(UserRole),
  });
}

/**
 * Permission-based API protection
 */
export function requirePermissions(
  permissions: Permission[],
  handler: (request: NextRequest, user: AuthenticatedUser, context: any) => Promise<NextResponse>
) {
  return requireAuth(handler, {
    requiredPermissions: permissions,
  });
}