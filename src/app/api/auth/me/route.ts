import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRolePermissions } from '@/lib/permissions';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get full user data from database
    const fullUser = await User.findById(user.id)
      .select('-password -passwordResetToken')
      .populate('hospitalId');

    if (!fullUser || !fullUser.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Get user permissions
    const permissions = getRolePermissions(fullUser.role as any);

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser._id,
        userId: fullUser.userId,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        fullName: fullUser.fullName,
        phone: fullUser.phone,
        role: fullUser.role,
        hospitalId: fullUser.hospitalId,
        isActive: fullUser.isActive,
        lastLogin: fullUser.lastLogin,
        createdAt: fullUser.createdAt,
        permissions,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}