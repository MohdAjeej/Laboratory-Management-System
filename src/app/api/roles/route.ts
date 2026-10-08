import { NextRequest, NextResponse } from 'next/server';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission, UserRole, ROLE_PERMISSIONS, getRolePermissions } from '@/lib/permissions';

// GET /api/roles - Get all roles and their permissions
export const GET = withPermissionAuth(
  [Permission.MANAGE_ROLES, Permission.READ_USER],
  false, // User needs at least one of these permissions
  async (request: NextRequest, user: any) => {
    try {
      const roles = Object.values(UserRole).map(role => ({
        id: role,
        name: role,
        displayName: role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        permissions: getRolePermissions(role),
        userCount: 0, // This would be fetched from database in a real implementation
      }));

      // Filter roles based on user's permissions
      const filteredRoles = user.role === UserRole.ADMIN 
        ? roles 
        : roles.filter(role => role.id !== UserRole.ADMIN);

      return NextResponse.json({
        success: true,
        data: filteredRoles,
      });
    } catch (error) {
      console.error('Get roles error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      );
    }
  }
);