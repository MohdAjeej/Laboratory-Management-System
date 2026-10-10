import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Hospital from '@/models/Hospital';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validateDoctor } from '@/lib/validators/masterData';

// GET /api/doctors — List doctors with search/pagination
export const GET = withPermissionAuth(
  [Permission.READ_DOCTOR],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search = searchParams.get('search') || '';
      const hospitalId = searchParams.get('hospitalId') || '';
      const specialization = searchParams.get('specialization') || '';
      const isActive = searchParams.get('isActive');
      const sort = searchParams.get('sort') || 'createdAt';
      const order = searchParams.get('order') === 'asc' ? 1 : -1;

      const query: any = {};

      if (search) {
        query.$or = [
          { doctorId: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { registrationNumber: { $regex: search, $options: 'i' } },
          { specialization: { $regex: search, $options: 'i' } },
        ];
      }

      if (hospitalId) {
        query.hospitalIds = hospitalId;
      }

      if (specialization) {
        query.specialization = { $regex: specialization, $options: 'i' };
      }

      if (isActive !== null && isActive !== '' && isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const skip = (page - 1) * limit;
      const sortObj: any = {};
      sortObj[sort] = order;

      const [doctors, total] = await Promise.all([
        Doctor.find(query)
          .populate('hospitalIds', 'name code')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Doctor.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          doctors,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      console.error('Get doctors error:', error);
      return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
    }
  }
);

// POST /api/doctors — Create doctor
export const POST = withPermissionAuth(
  [Permission.CREATE_DOCTOR],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validation = validateDoctor(body);
      if (validation.hasErrors()) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 400 });
      }

      // Check duplicate registration number
      const existing = await Doctor.findOne({ registrationNumber: body.registrationNumber });
      if (existing) {
        return NextResponse.json({ error: 'Doctor with this registration number already exists' }, { status: 409 });
      }

      // Validate all hospital IDs exist
      if (body.hospitalIds && body.hospitalIds.length > 0) {
        const hospitals = await Hospital.find({ _id: { $in: body.hospitalIds } });
        if (hospitals.length !== body.hospitalIds.length) {
          return NextResponse.json({
            error: 'One or more hospital IDs are invalid',
          }, { status: 400 });
        }
      }

      const doctor = await Doctor.create(body);

      await auditUserAction(
        user.id, user.role, AuditAction.CREATE, 'Doctor',
        doctor.doctorId || doctor._id.toString(),
        `Created doctor: Dr. ${doctor.firstName} ${doctor.lastName}`
      );

      return NextResponse.json({ success: true, data: doctor }, { status: 201 });
    } catch (error) {
      console.error('Create doctor error:', error);
      return NextResponse.json({ error: 'Failed to create doctor' }, { status: 500 });
    }
  }
);
