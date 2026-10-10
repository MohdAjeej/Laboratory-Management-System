import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Test from '@/models/Test';
import Order from '@/models/Order';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validatePartialTest } from '@/lib/validators/masterData';

// GET /api/tests/[id]
export const GET = withPermissionAuth(
  [Permission.READ_TEST],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      const test = await Test.findById(id).lean();
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: test });
    } catch (error) {
      console.error('Get test error:', error);
      return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
    }
  }
);

// PUT /api/tests/[id]
export const PUT = withPermissionAuth(
  [Permission.UPDATE_TEST],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;
      const body = await request.json();

      // Validate partial update
      const validation = validatePartialTest(body);
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
        const existing = await Test.findOne({ code: body.code, _id: { $ne: id } });
        if (existing) {
          return NextResponse.json({
            error: 'Test with this code already exists',
          }, { status: 409 });
        }
      }

      const test = await Test.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id, user.role, AuditAction.UPDATE, 'Test',
        test.testId || test._id.toString(),
        `Updated test: ${test.name} (${test.code})`
      );

      return NextResponse.json({ success: true, data: test });
    } catch (error) {
      console.error('Update test error:', error);
      return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
    }
  }
);

// DELETE /api/tests/[id] (soft-delete)
export const DELETE = withPermissionAuth(
  [Permission.DELETE_TEST],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      // Check if test is referenced by orders before deleting
      const orderCount = await Order.countDocuments({ 'items.testId': id });
      if (orderCount > 0) {
        return NextResponse.json({
          error: 'Cannot deactivate test with existing orders',
          details: { orderCount },
        }, { status: 409 });
      }

      const test = await Test.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id, user.role, AuditAction.DELETE, 'Test',
        test.testId || test._id.toString(),
        `Deactivated test: ${test.name}`
      );

      return NextResponse.json({ success: true, message: 'Test deactivated' });
    } catch (error) {
      console.error('Delete test error:', error);
      return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
    }
  }
);
