import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Order from '@/models/Order';
import Report from '@/models/Report';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validatePartialPatient } from '@/lib/validators/masterData';

// GET /api/patients/[id] — Patient detail with optional history
export const GET = withPermissionAuth(
  [Permission.READ_PATIENT],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      const { searchParams } = new URL(request.url);
      const includeHistory = searchParams.get('history') === 'true';

      const patient = await Patient.findById(id).lean();
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }

      const result: any = { ...patient };

      if (includeHistory) {
        const [orders, reports] = await Promise.all([
          Order.find({ patientId: id })
            .populate('items.testId', 'name code')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(),
          Report.find({ patientId: id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(),
        ]);
        result.orders = orders;
        result.reports = reports;
      }

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      console.error('Get patient error:', error);
      return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
    }
  }
);

// PUT /api/patients/[id]
export const PUT = withPermissionAuth(
  [Permission.UPDATE_PATIENT],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;
      const body = await request.json();

      // Validate partial update
      const validation = validatePartialPatient(body);
      if (validation.hasErrors()) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 400 });
      }

      const patient = await Patient.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id, user.role, AuditAction.UPDATE, 'Patient',
        patient.patientId,
        `Updated patient: ${patient.firstName} ${patient.lastName}`
      );

      return NextResponse.json({ success: true, data: patient });
    } catch (error) {
      console.error('Update patient error:', error);
      return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
    }
  }
);

// DELETE /api/patients/[id] (soft-delete)
export const DELETE = withPermissionAuth(
  [Permission.DELETE_PATIENT],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      // Check if patient has orders or reports before deactivating
      const [orderCount, reportCount] = await Promise.all([
        Order.countDocuments({ patientId: id }),
        Report.countDocuments({ patientId: id }),
      ]);

      if (orderCount > 0 || reportCount > 0) {
        return NextResponse.json({
          error: 'Cannot deactivate patient with existing records',
          details: { orderCount, reportCount },
          message: 'Patient can only be deactivated. Historical records will be preserved.',
        }, { status: 409 });
      }

      const patient = await Patient.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id, user.role, AuditAction.DELETE, 'Patient',
        patient.patientId,
        `Deactivated patient: ${patient.firstName} ${patient.lastName}`
      );

      return NextResponse.json({ success: true, message: 'Patient deactivated' });
    } catch (error) {
      console.error('Delete patient error:', error);
      return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
    }
  }
);
