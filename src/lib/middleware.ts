import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, hasAllPermissions, Permission, UserRole } from '@/lib/permissions';

// Higher-order function to protect API routes
export function withAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const user = await getCurrentUser(request);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      return handler(request, user);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

// Higher-order function to protect API routes with role-based access
export function withRoleAuth(
  allowedRoles: UserRole[],
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: any) => {
    if (!allowedRoles.includes(user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, user);
  });
}

// Higher-order function to protect API routes with permission-based access
export function withPermissionAuth(
  requiredPermissions: Permission[],
  requireAll: boolean = true,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: any) => {
    const userRole = user.role as UserRole;
    
    const hasAccess = requireAll
      ? hasAllPermissions(userRole, requiredPermissions)
      : requiredPermissions.some(permission => hasPermission(userRole, permission));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, user);
  });
}

// Middleware to check hospital access for hospital staff
export function withHospitalAccess(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: any) => {
    const userRole = user.role as UserRole;
    
    // Admin and lab admin have access to all hospitals
    if (userRole === UserRole.ADMIN || userRole === UserRole.LAB_ADMIN) {
      return handler(request, user);
    }

    // Hospital staff can only access their own hospital data
    if (userRole === UserRole.HOSPITAL_STAFF) {
      const hospitalId = request.nextUrl.searchParams.get('hospitalId') ||
                        request.headers.get('x-hospital-id');
      
      if (hospitalId && hospitalId !== user.hospitalId) {
        return NextResponse.json(
          { error: 'Access denied - Hospital data restricted' },
          { status: 403 }
        );
      }
    }

    return handler(request, user);
  });
}

// Middleware to check patient data access
export function withPatientAccess(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: any) => {
    const userRole = user.role as UserRole;
    
    // Patients can only access their own data
    if (userRole === UserRole.PATIENT) {
      const patientId = request.nextUrl.searchParams.get('patientId') ||
                       request.headers.get('x-patient-id');
      
      if (patientId && patientId !== user.id) {
        return NextResponse.json(
          { error: 'Access denied - Patient data restricted' },
          { status: 403 }
        );
      }
    }

    return handler(request, user);
  });
}

// Combine multiple middleware functions
export function combineMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: any) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

// Rate limiting middleware (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const now = Date.now();
    const rateLimitInfo = rateLimitMap.get(clientIP);
    
    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      // Reset or create rate limit info
      rateLimitMap.set(clientIP, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // Increment count
      rateLimitInfo.count++;
      
      if (rateLimitInfo.count > maxRequests) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimitInfo.resetTime - now) / 1000).toString(),
            },
          }
        );
      }
    }
    
    return handler(request);
  };
}

// CORS middleware
export function withCORS(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    origin?: string[];
    methods?: string[];
    headers?: string[];
  } = {}
) {
  return async (request: NextRequest) => {
    const response = await handler(request);
    
    const origin = request.headers.get('origin');
    const allowedOrigins = options.origin || ['http://localhost:3000'];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set(
      'Access-Control-Allow-Methods',
      (options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']).join(', ')
    );
    
    response.headers.set(
      'Access-Control-Allow-Headers',
      (options.headers || [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Hospital-Id',
        'X-Patient-Id',
      ]).join(', ')
    );
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  };
}

// Handle OPTIONS requests for CORS preflight
export function handleCORSPreflight() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

// Error handling middleware
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);
      
      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      const errorMessage = isDevelopment && error instanceof Error 
        ? error.message 
        : 'Internal server error';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  };
}