import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Hospital from '@/models/Hospital'; // Import Hospital model for populate
import { withAuth, withPermissionAuth } from '@/lib/middleware';
import { Permission, UserRole } from '@/lib/permissions';
import { createUserSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';
import { auditUserAction, AuditAction } from '@/lib/audit';

// GET /api/users - List users with pagination and filtering
export const GET = withPermissionAuth(
  [Permission.READ_USER],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role') || '';
      const isActive = searchParams.get('isActive');

      // Build query
      const query: any = {};
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } },
        ];
      }

      if (role) {
        query.role = role;
      }

      if (isActive !== null && isActive !== '') {
        query.isActive = isActive === 'true';
      }

      // Hospital staff can only see users from their hospital
      if (user.role === UserRole.HOSPITAL_STAFF && user.hospitalId) {
        query.hospitalId = user.hospitalId;
      }

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -passwordResetToken')
          .populate('hospitalId', 'name code')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  }
);

// POST /api/users - Create new user
export const POST = withPermissionAuth(
  [Permission.CREATE_USER],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();

      const body = await request.json();
      
      // Validate input
      const validation = createUserSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        );
      }

      const userData = validation.data;

      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Generate userId
      const userCount = await User.countDocuments();
      const userId = `USR-${new Date().getFullYear()}-${(userCount + 1).toString().padStart(6, '0')}`;

      // Create user
      const newUser = await User.create({
        ...userData,
        userId,
        password: hashedPassword,
      });

      // Audit log
      await auditUserAction(
        user.id,
        user.role,
        AuditAction.CREATE,
        'User',
        newUser.userId,
        `Created user: ${newUser.email} with role ${newUser.role}`
      );

      // Return user without password
      const { password, ...userResponse } = newUser.toObject();

      return NextResponse.json({
        success: true,
        data: userResponse,
      }, { status: 201 });
    } catch (error) {
      console.error('Create user error:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
  }
);