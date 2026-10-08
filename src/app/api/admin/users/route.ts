import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { UserRole } from '@/lib/permissions';
import { requireAdmin } from '@/lib/api-auth';
import { auditUserAction, AuditAction } from '@/lib/audit';

// Validation schema for creating users
const createUserSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters'),
  role: z.nativeEnum(UserRole),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  hospitalId: z.string().optional(),
});

const getUsersQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
});

// GET /api/admin/users - List users with pagination and filters
async function getUsers(request: NextRequest, user: any) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const query = getUsersQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || '',
      role: searchParams.get('role') || '',
      status: searchParams.get('status') || '',
    });

    // Build MongoDB filter
    const filter: any = {};

    // Search filter
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { userId: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Role filter
    if (query.role && query.role !== 'all') {
      filter.role = query.role;
    }

    // Status filter
    if (query.status && query.status !== 'all') {
      filter.isActive = query.status === 'active';
    }

    // Get total count
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / query.limit);

    // Get paginated users
    const users = await User.find(filter)
      .select('-password -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('hospitalId', 'name code')
      .lean();

    return NextResponse.json({
      users,
      pagination: {
        currentPage: query.page,
        totalPages,
        totalUsers,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user (Admin only)
async function createUser(request: NextRequest, user: any, context: any) {
  try {
    await connectToDatabase();

    const body = await request.json();
    
    // Validate input
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, role, password, hospitalId } = validationResult.data;

    // Security check: Prevent creating ADMIN accounts unless explicitly allowed
    if (role === UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Cannot create Admin accounts through this endpoint' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if phone number is already in use
    const existingPhone = await User.findOne({ phone: phone.replace(/\s/g, '') });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'This phone number is already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique user ID
    const userCount = await User.countDocuments();
    const userId = `USR-${new Date().getFullYear()}-${(userCount + 1).toString().padStart(6, '0')}`;

    // Create user
    const newUser = await User.create({
      userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone.replace(/\s/g, ''),
      role,
      hospitalId: hospitalId || undefined,
      isActive: true,
    });

    // Create audit log
    await auditUserAction(
      user.userId,
      user.role,
      AuditAction.CREATE,
      'User',
      newUser._id.toString(),
      `Admin created new user: ${newUser.email} with role ${newUser.role}`,
      {
        userId: newUser.userId,
        email: newUser.email,
        role: newUser.role,
        createdBy: user.userId,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    );

    // Return created user (without password)
    const { password: _, ...userResponse } = newUser.toObject();
    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userResponse
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Export handlers with middleware
export const GET = requireAdmin(getUsers);
export const POST = requireAdmin(createUser);