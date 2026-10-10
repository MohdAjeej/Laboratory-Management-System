import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Hospital from '@/models/Hospital';
import Order from '@/models/Order';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validatePartialHospital } from '@/lib/validators/masterData';

// GET /api/hospitals/[id]
export const GET = withPermissionAuth(
  [Permission.READ_HOSPITAL],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      const hospital = await Hospital.findById(id).lean();
      if (!hospital) {
        return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: hospital });
    } catch (error) {
      console.error('Get hospital error:', error);
      return NextResponse.json({ error: 'Failed to fetch hospital' }, { status: 500 });
    }
  }
);

// PUT /api/hospitals/[id]
export const PUT = withPermissionAuth(
  [Permission.UPDATE_HOSPITAL],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;
      const body = await request.json();

      // Validate partial update
      const validation = validatePartialHospital(body);
      if (validation.hasErrors()) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 400 });
      }

      // Normalize code if provided
      if (body.code) {
        body.code = body.code.toUpperCase();
        
        // Check for duplicate code
        const existing = await Hospital.findOne({ code: body.code, _id: { $ne: id } });
        if (existing) {
          return NextResponse.json({
            error: 'Hospital with this code already exists',
          }, { status: 409 });
        }
      }

      const hospital = await Hospital.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!hospital) {
        return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id, user.role, AuditAction.UPDATE, 'Hospital',
        hospital.hospitalId || hospital._id.toString(),
        `Updated hospital: ${hospital.name}`
      );

      return NextResponse.json({ success: true, data: hospital });
    } catch (error) {
      console.error('Update hospital error:', error);
      return NextResponse.json({ error: 'Failed to update hospital' }, { status: 500 });
    }
  }
);

// DELETE /api/hospitals/[id] (soft-delete)
export const DELETE = withPermissionAuth(
  [Permission.DELETE_HOSPITAL],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      // Check if hospital is referenced by orders before deleting
      const orderCount = await Order.countDocuments({ hospitalId: id });
      if (orderCount > 0) {
        return NextResponse.json({
          error: 'Cannot deactivate hospital with existing orders',
          details: { orderCount },
        }, { status: 409 });
      }

      const hospital = await Hospital.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!hospital) {
        return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id, user.role, AuditAction.DELETE, 'Hospital',
        hospital.hospitalId || hospital._id.toString(),
        `Deactivated hospital: ${hospital.name}`
      );

      return NextResponse.json({ success: true, message: 'Hospital deactivated' });
    } catch (error) {
      console.error('Delete hospital error:', error);
      return NextResponse.json({ error: 'Failed to delete hospital' }, { status: 500 });
    }
  }
);
