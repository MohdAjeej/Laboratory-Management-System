import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { UserRole, hasPermission, Permission } from '@/lib/permissions';

export interface AuthorizedUser {
  userId: string;
  email: string;
  role: UserRole;
  hospitalId?: string;
}

/**
 * Authorization middleware for API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>,
  options?: {
    requiredRoles?: UserRole[];
    requiredPermissions?: Permission[];
    allowSelf?: boolean; // Allow access to own data
  }
) {
  return async (request: NextRequest, context?: { params: any }) => {
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

      const user: AuthorizedUser = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
        hospitalId: payload.hospitalId,
      };

      // Check required roles
      if (options?.requiredRoles && !options.requiredRoles.includes(user.role)) {
        // Check if user is trying to access their own data
        if (options.allowSelf && context?.params?.id === user.userId) {
          // Allow access to own data
        } else {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Check required permissions
      if (options?.requiredPermissions) {
        const hasRequiredPermissions = options.requiredPermissions.every(
          permission => hasPermission(user.role, permission)
        );
        
        if (!hasRequiredPermissions) {
          return NextResponse.json(
            { error: 'Insufficient permissions for this operation' },
            { status: 403 }
          );
        }
      }

      // Call the handler with authenticated user
      return handler(request, user);
    } catch (error) {
      console.error('Authorization error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Admin-only authorization middleware
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requiredRoles: [UserRole.ADMIN],
  });
}

/**
 * Staff-level authorization middleware (Lab Admin and above)
 */
export function withStaffAuth(
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
) {
  return withAuth(handler, {
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
 * Patient or higher authorization middleware
 */
export function withPatientAuth(
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requiredRoles: Object.values(UserRole),
  });
}

/**
 * Permission-based authorization middleware
 */
export function withPermissions(
  permissions: Permission[],
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requiredPermissions: permissions,
  });
}

/**
 * Hospital-specific authorization middleware
 */
export function withHospitalAuth(
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: any }) => {
    return withAuth(async (req, user) => {
      // Admin and Lab Admin can access all hospital data
      if (user.role === UserRole.ADMIN || user.role === UserRole.LAB_ADMIN) {
        return handler(req, user);
      }

      // Hospital staff can only access their own hospital data
      if (user.role === UserRole.HOSPITAL_STAFF) {
        const targetHospitalId = context?.params?.hospitalId || req.nextUrl.searchParams.get('hospitalId');
        
        if (targetHospitalId && user.hospitalId !== targetHospitalId) {
          return NextResponse.json(
            { error: 'Access denied: Hospital data restriction' },
            { status: 403 }
          );
        }
      }

      return handler(req, user);
    })(request, context);
  };
}

/**
 * Self-access authorization middleware (users can access their own data)
 */
export function withSelfAuth(
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
) {
  return withAuth(handler, {
    allowSelf: true,
  });
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return withAuth(async (request, user) => {
    const clientId = user.userId;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < now) {
        requests.delete(key);
      }
    }

    // Get or create request tracking
    const userRequests = requests.get(clientId) || { count: 0, resetTime: now + windowMs };
    
    // Check if within rate limit
    if (userRequests.count >= maxRequests && userRequests.resetTime > now) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
        },
        { status: 429 }
      );
    }

    // Reset counter if window has passed
    if (userRequests.resetTime <= now) {
      userRequests.count = 0;
      userRequests.resetTime = now + windowMs;
    }

    // Increment counter
    userRequests.count++;
    requests.set(clientId, userRequests);

    return handler(request, user);
  });
}

/**
 * Audit logging middleware
 */
export function withAudit(
  action: string,
  entity: string,
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
) {
  return withAuth(async (request, user) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(request, user);
      
      // Log successful operations
      if (response.status < 400) {
        // Import audit function dynamically to avoid circular imports
        const { auditUserAction, AuditAction } = await import('@/lib/audit');
        
        await auditUserAction(
          user.userId,
          user.role,
          action as any, // Convert string to AuditAction enum
          entity,
          'N/A', // Entity ID would be extracted from response if needed
          `${action} performed on ${entity}`,
          {
            method: request.method,
            url: request.url,
            duration: Date.now() - startTime,
            ipAddress: request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          }
        );
      }
      
      return response;
    } catch (error) {
      console.error(`Audit error for ${action} on ${entity}:`, error);
      throw error;
    }
  });
}

/**
 * Input validation middleware
 */
export function withValidation<T>(
  schema: any, // Zod schema
  handler: (request: NextRequest, user: AuthorizedUser, data: T) => Promise<NextResponse>
) {
  return withAuth(async (request, user) => {
    try {
      const body = await request.json();
      const validationResult = schema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: validationResult.error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            }))
          },
          { status: 400 }
        );
      }
      
      return handler(request, user, validationResult.data);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON data' },
        { status: 400 }
      );
    }
  });
}

/**
 * Combine multiple middleware functions
 */
export function compose(...middlewares: any[]) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc);
    }, handler);
  };
}

// Export commonly used middleware combinations
export const adminOnly = withAdminAuth;
export const staffOnly = withStaffAuth;
export const authenticated = withPatientAuth;
export const selfAccess = withSelfAuth;