import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, withPermissionAuth } from '@/lib/middleware';
import { Permission, UserRole } from '@/lib/permissions';
import { updateUserSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';
import { auditUserAction, AuditAction } from '@/lib/audit';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionAuth(
    [Permission.READ_USER],
    true,
    async (req: NextRequest, user: any) => {
      try {
        await connectToDatabase();

        const targetUser = await User.findById(params.id)
          .select('-password -passwordResetToken')
          .populate('hospitalId', 'name code')
          .lean();

        if (!targetUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Hospital staff can only view users from their hospital
        if (user.role === UserRole.HOSPITAL_STAFF && user.hospitalId) {
          if (targetUser.hospitalId?._id?.toString() !== user.hospitalId) {
            return NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            );
          }
        }

        return NextResponse.json({
          success: true,
          data: targetUser,
        });
      } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch user' },
          { status: 500 }
        );
      }
    }
  )(request);
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionAuth(
    [Permission.UPDATE_USER],
    true,
    async (req: NextRequest, user: any) => {
      try {
        await connectToDatabase();

        const body = await request.json();
        
        // Validate input
        const validation = updateUserSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid input', details: validation.error.issues },
            { status: 400 }
          );
        }

        const updateData = validation.data;

        // Find existing user
        const existingUser = await User.findById(params.id);
        if (!existingUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Hospital staff can only update users from their hospital
        if (user.role === UserRole.HOSPITAL_STAFF && user.hospitalId) {
          if (existingUser.hospitalId?.toString() !== user.hospitalId) {
            return NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            );
          }
        }

        // Check if email is being changed and if it already exists
        if (updateData.email && updateData.email !== existingUser.email) {
          const emailExists = await User.findByEmail(updateData.email);
          if (emailExists) {
            return NextResponse.json(
              { error: 'User with this email already exists' },
              { status: 409 }
            );
          }
        }

        // Prevent non-admins from changing roles to admin
        if (updateData.role === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
          return NextResponse.json(
            { error: 'Insufficient permissions to assign admin role' },
            { status: 403 }
          );
        }

        // Store old values for audit
        const oldValues = {
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role: existingUser.role,
          isActive: existingUser.isActive,
        };

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
          params.id,
          { $set: updateData },
          { new: true, runValidators: true }
        ).select('-password -passwordResetToken').populate('hospitalId', 'name code');

        // Audit log
        await auditUserAction(
          user.id,
          user.role,
          AuditAction.UPDATE,
          'User',
          updatedUser!.userId,
          `Updated user: ${updatedUser!.email}`,
          {
            oldValues,
            newValues: updateData,
          }
        );

        return NextResponse.json({
          success: true,
          data: updatedUser,
        });
      } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        );
      }
    }
  )(request);
}

// DELETE /api/users/[id] - Soft delete user (deactivate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionAuth(
    [Permission.DELETE_USER],
    true,
    async (req: NextRequest, user: any) => {
      try {
        await connectToDatabase();

        const targetUser = await User.findById(params.id);
        if (!targetUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Prevent deleting admin (unless done by admin)
        if (targetUser.role === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
          return NextResponse.json(
            { error: 'Cannot delete admin user' },
            { status: 403 }
          );
        }

        // Prevent self-deletion
        if (targetUser._id.toString() === user.id) {
          return NextResponse.json(
            { error: 'Cannot delete your own account' },
            { status: 403 }
          );
        }

        // Hospital staff can only delete users from their hospital
        if (user.role === UserRole.HOSPITAL_STAFF && user.hospitalId) {
          if (targetUser.hospitalId?.toString() !== user.hospitalId) {
            return NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            );
          }
        }

        // Soft delete (deactivate)
        await User.findByIdAndUpdate(params.id, { isActive: false });

        // Audit log
        await auditUserAction(
          user.id,
          user.role,
          AuditAction.DELETE,
          'User',
          targetUser.userId,
          `Deactivated user: ${targetUser.email}`
        );

        return NextResponse.json({
          success: true,
          message: 'User deactivated successfully',
        });
      } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
          { error: 'Failed to delete user' },
          { status: 500 }
        );
      }
    }
  )(request);
}