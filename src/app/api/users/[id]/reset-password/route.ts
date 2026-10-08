import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission, UserRole } from '@/lib/permissions';
import { hashPassword, generateRandomString } from '@/lib/auth';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { sendEmailNotification } from '@/lib/notifications';

// POST /api/users/[id]/reset-password - Reset user password
export async function POST(
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
        const { generateNew = false, newPassword } = body;

        const targetUser = await User.findById(params.id);
        if (!targetUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Hospital staff can only reset passwords for users from their hospital
        if (user.role === UserRole.HOSPITAL_STAFF && user.hospitalId) {
          if (targetUser.hospitalId?.toString() !== user.hospitalId) {
            return NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            );
          }
        }

        let password: string;
        
        if (generateNew) {
          // Generate random password
          password = generateRandomString(12);
        } else if (newPassword) {
          // Use provided password
          password = newPassword;
        } else {
          return NextResponse.json(
            { error: 'Either generateNew or newPassword must be provided' },
            { status: 400 }
          );
        }

        // Hash the new password
        const hashedPassword = await hashPassword(password);

        // Update user password
        await User.findByIdAndUpdate(params.id, {
          password: hashedPassword,
          passwordResetToken: undefined,
          passwordResetExpires: undefined,
        });

        // Send email with new password if generated
        if (generateNew && targetUser.email) {
          try {
            await sendEmailNotification(
              targetUser.email,
              'Password Reset - LIMS',
              `Your password has been reset. Your new password is: ${password}\n\nPlease change this password after logging in.`
            );
          } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            // Don't fail the request if email fails
          }
        }

        // Audit log
        await auditUserAction(
          user.id,
          user.role,
          AuditAction.UPDATE,
          'User',
          targetUser.userId,
          `Password reset for user: ${targetUser.email}`,
          { resetType: generateNew ? 'generated' : 'manual' }
        );

        return NextResponse.json({
          success: true,
          message: 'Password reset successfully',
          ...(generateNew && { temporaryPassword: password }),
        });
      } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
          { error: 'Failed to reset password' },
          { status: 500 }
        );
      }
    }
  )(request);
}