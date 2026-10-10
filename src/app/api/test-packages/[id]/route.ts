import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TestPackage from '@/models/TestPackage';
import Test from '@/models/Test';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validateTestPackage, validatePartialTestPackage } from '@/lib/validators/masterData';

// GET /api/test-packages/[id] — Get package by ID
export const GET = withPermissionAuth(
  [Permission.READ_TEST],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      const pkg = await TestPackage.findById(id)
        .populate('tests.testId', 'name code category price sampleType turnaroundTime')
        .lean();

      if (!pkg) {
        return NextResponse.json({ error: 'Test package not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: pkg });
    } catch (error) {
      console.error('Get test package error:', error);
      return NextResponse.json({ error: 'Failed to fetch test package' }, { status: 500 });
    }
  }
);

// PUT /api/test-packages/[id] — Update package
export const PUT = withPermissionAuth(
  [Permission.UPDATE_TEST],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;
      const body = await request.json();

      // Validate partial update
      const validation = validatePartialTestPackage(body);
      if (validation.hasErrors()) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 400 });
      }

      // If updating tests array, validate all test IDs exist
      if (body.tests && Array.isArray(body.tests)) {
        const testIds = body.tests.map((t: any) => t.testId);
        const existingTests = await Test.find({ _id: { $in: testIds } });
        if (existingTests.length !== testIds.length) {
          return NextResponse.json({
            error: 'One or more test IDs are invalid',
          }, { status: 400 });
        }
      }

      // Check for duplicate code if code is being updated
      if (body.code) {
        const existing = await TestPackage.findOne({
          code: body.code.toUpperCase(),
          _id: { $ne: id },
        });
        if (existing) {
          return NextResponse.json({
            error: 'Package with this code already exists',
          }, { status: 409 });
        }
      }

      const pkg = await TestPackage.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      }).populate('tests.testId', 'name code category price');

      if (!pkg) {
        return NextResponse.json({ error: 'Test package not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.UPDATE,
        'TestPackage',
        pkg.packageId || pkg._id.toString(),
        `Updated test package: ${pkg.name}`
      );

      return NextResponse.json({ success: true, data: pkg });
    } catch (error) {
      console.error('Update test package error:', error);
      return NextResponse.json({ error: 'Failed to update test package' }, { status: 500 });
    }
  }
);

// DELETE /api/test-packages/[id] — Deactivate package
export const DELETE = withPermissionAuth(
  [Permission.DELETE_TEST],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      const pkg = await TestPackage.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!pkg) {
        return NextResponse.json({ error: 'Test package not found' }, { status: 404 });
      }

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.DELETE,
        'TestPackage',
        pkg.packageId || pkg._id.toString(),
        `Deactivated test package: ${pkg.name}`
      );

      return NextResponse.json({
        success: true,
        message: 'Test package deactivated successfully',
      });
    } catch (error) {
      console.error('Delete test package error:', error);
      return NextResponse.json({ error: 'Failed to delete test package' }, { status: 500 });
    }
  }
);