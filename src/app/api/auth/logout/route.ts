import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { auditUserAction, AuditAction } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // Get current user for audit logging
    const user = await getCurrentUser(request);
    
    if (user) {
      // Create audit log
      await auditUserAction(
        user.id,
        user.role,
        AuditAction.LOGOUT,
        'User',
        user.id,
        'User logged out'
      );
    }

    // Clear auth cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}