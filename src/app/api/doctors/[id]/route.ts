import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Hospital from '@/models/Hospital';
import Order from '@/models/Order';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validatePartialDoctor } from '@/lib/validators/masterData';

// GET /api/doctors/[id]
export const GET = withPermissionAuth(
  [Permission.READ_DOCTOR],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      const doctor = await Doctor.findById(id).populate('hospitalIds', 'name code').lean();
      if (!doctor) {
        return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: doctor });
    } catch (error) {
      console.error('Get doctor error:', error);
      return NextResponse.json({ error: 'Failed to fetch doctor' }, { status: 500 });
    }
  }
);

// PUT /api/doctors/[id]
export const PUT = withPermissionAuth(
  [Permission.UPDATE_DOCTOR],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;
      const body = await request.json();

      // Validate partial update
      const validation = validatePartialDoctor(body);
      if (validation.hasErrors()) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 400 });
      }

      // Check for duplicate registration number if being updated
      if (body.registrationNumber) {
        const existing = await Doctor.findOne({
          registrationNumber: body.registrationNumber,
          _id: { $ne: id },
        });
        if (existing) {
          return NextResponse.json({
            error: 'Doctor with this registration number already exists',
          }, { status: 409 });
        }
      }

      // Validate hospital IDs if provided
      if (body.hospitalIds && body.hospitalIds.length > 0) {
        const hospitals = await Hospital.find({ _id: { $in: body.hospitalIds } });
        if (hospitals.length !== body.hospitalIds.length) {
          return NextResponse.json({
            error: 'One or more hospital IDs are invalid',
          }, { status: 400 });
        }
      }

      const doctor = await Doctor.findByIdAndUpdate(id, body, { new: true, runValidators: true })
        .populate('hospitalIds', 'name code');
      if (!doctor) {
        return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id, user.role, AuditAction.UPDATE, 'Doctor',
        doctor.doctorId || doctor._id.toString(),
        `Updated doctor: Dr. ${doctor.firstName} ${doctor.lastName}`
      );

      return NextResponse.json({ success: true, data: doctor });
    } catch (error) {
      console.error('Update doctor error:', error);
      return NextResponse.json({ error: 'Failed to update doctor' }, { status: 500 });
    }
  }
);

// DELETE /api/doctors/[id] (soft-delete)
export const DELETE = withPermissionAuth(
  [Permission.DELETE_DOCTOR],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      // Check if doctor is referenced by orders before deleting
      const orderCount = await Order.countDocuments({ doctorId: id });
      if (orderCount > 0) {
        return NextResponse.json({
          error: 'Cannot deactivate doctor with existing orders',
          details: { orderCount },
        }, { status: 409 });
      }

      const doctor = await Doctor.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!doctor) {
        return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id, user.role, AuditAction.DELETE, 'Doctor',
        doctor.doctorId || doctor._id.toString(),
        `Deactivated doctor: Dr. ${doctor.firstName} ${doctor.lastName}`
      );

      return NextResponse.json({ success: true, message: 'Doctor deactivated' });
    } catch (error) {
      console.error('Delete doctor error:', error);
      return NextResponse.json({ error: 'Failed to delete doctor' }, { status: 500 });
    }
  }
);
