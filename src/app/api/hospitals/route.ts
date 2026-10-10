import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Hospital from '@/models/Hospital';
import User from '@/models/User';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission, UserRole } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validateHospital } from '@/lib/validators/masterData';
import { hashPassword } from '@/lib/auth';

// GET /api/hospitals — List hospitals with search/pagination
export const GET = withPermissionAuth(
  [Permission.READ_HOSPITAL],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search = searchParams.get('search') || '';
      const isActive = searchParams.get('isActive');
      const sort = searchParams.get('sort') || 'createdAt';
      const order = searchParams.get('order') === 'asc' ? 1 : -1;

      const query: any = {};

      if (search) {
        query.$or = [
          { hospitalId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { contactPerson: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      if (isActive !== null && isActive !== '' && isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const skip = (page - 1) * limit;
      const sortObj: any = {};
      sortObj[sort] = order;

      const [hospitals, total] = await Promise.all([
        Hospital.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Hospital.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          hospitals,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      console.error('Get hospitals error:', error);
      return NextResponse.json({ error: 'Failed to fetch hospitals' }, { status: 500 });
    }
  }
);

// POST /api/hospitals — Create hospital
export const POST = withPermissionAuth(
  [Permission.CREATE_HOSPITAL],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validation = validateHospital(body);
      if (validation.hasErrors()) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 400 });
      }

      // Normalize code to uppercase
      body.code = body.code.toUpperCase();

      // Check for duplicate code
      const existing = await Hospital.findOne({ code: body.code });
      if (existing) {
        return NextResponse.json({ error: 'Hospital with this code already exists' }, { status: 409 });
      }

      const hospital = await Hospital.create(body);

      // Auto-create hospital staff user
      const userCount = await User.countDocuments();
      const userId = `USR-${new Date().getFullYear()}-${(userCount + 1).toString().padStart(6, '0')}`;
      
      // Generate default password: HospitalCode@123 (e.g., MHC@123)
      const defaultPassword = `${body.code}@123`;
      const hashedPassword = await hashPassword(defaultPassword);

      // Extract first and last name from contactPerson or use defaults
      const contactPerson = body.contactPerson?.trim() || body.name;
      const nameParts = contactPerson.split(' ');
      const firstName = nameParts[0] || 'Hospital';
      const lastName = nameParts.slice(1).join(' ') || 'Admin';

      const hospitalUser = await User.create({
        userId,
        email: body.email, // Use hospital email as user email
        password: hashedPassword,
        firstName,
        lastName,
        role: UserRole.HOSPITAL_STAFF,
        hospitalId: hospital._id,
        phone: body.phone,
        isActive: true,
      });

      await auditUserAction(
        user.id, user.role, AuditAction.CREATE, 'Hospital',
        hospital.hospitalId || hospital._id.toString(),
        `Created hospital: ${hospital.name} with user: ${userId}`
      );

      return NextResponse.json({ 
        success: true, 
        data: {
          hospital,
          credentials: {
            userId: hospitalUser.userId,
            email: hospitalUser.email,
            password: defaultPassword, // Return plaintext password only once
            message: 'Save these credentials! The password cannot be retrieved again.'
          }
        }
      }, { status: 201 });
    } catch (error) {
      console.error('Create hospital error:', error);
      return NextResponse.json({ error: 'Failed to create hospital' }, { status: 500 });
    }
  }
);
