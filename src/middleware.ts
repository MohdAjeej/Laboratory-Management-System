import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { canAccessRoute, getDashboardRoute } from '@/lib/routing';
import { UserRole } from '@/lib/permissions';

// Force Node.js runtime for middleware
export const config = {
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (login endpoint)
     * - api/auth/register (registration endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes - they handle their own auth
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip middleware for public routes
  if (
    pathname.startsWith('/_next') ||
    pathname === '/register' ||
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/register/success' ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      // Invalid token - redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    const userRole = payload.role as UserRole;

    // Special handling for root path - redirect to appropriate dashboard
    if (pathname === '/') {
      const dashboardUrl = getDashboardRoute(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Check if user can access the requested route
    if (!canAccessRoute(userRole, pathname)) {
      // Redirect to their appropriate dashboard
      const dashboardUrl = getDashboardRoute(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // Add user info to request headers for use in components
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-role', payload.role);
    response.headers.set('x-user-email', payload.email);
    
    return response;
  } catch (error) {
    // Invalid token - redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

