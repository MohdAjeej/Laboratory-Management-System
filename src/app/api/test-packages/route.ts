import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import TestPackage from '@/models/TestPackage';
import Test from '@/models/Test';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validateTestPackage } from '@/lib/validators/masterData';

// GET /api/test-packages — List packages
export const GET = withPermissionAuth(
  [Permission.READ_TEST],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search = searchParams.get('search') || '';
      const category = searchParams.get('category') || '';
      const isActive = searchParams.get('isActive');
      const sort = searchParams.get('sort') || 'name';
      const order = searchParams.get('order') === 'desc' ? -1 : 1;

      const query: any = {};

      // Only show active packages by default unless explicitly filtering
      if (isActive !== null && isActive !== '' && isActive !== undefined) {
        query.isActive = isActive === 'true';
      } else {
        query.isActive = true; // Default to active
      }

      if (search) {
        query.$or = [
          { packageId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }

      if (category) query.category = { $regex: category, $options: 'i' };

      const skip = (page - 1) * limit;
      const sortObj: any = {};
      sortObj[sort] = order;

      const [packages, total] = await Promise.all([
        TestPackage.find(query)
          .populate('tests.testId', 'name code category price sampleType')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        TestPackage.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          packages,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      console.error('Get test packages error:', error);
      return NextResponse.json({ error: 'Failed to fetch test packages' }, { status: 500 });
    }
  }
);

// POST /api/test-packages — Create package
export const POST = withPermissionAuth(
  [Permission.CREATE_TEST],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validation = validateTestPackage(body);
      if (validation.hasErrors()) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 400 });
      }

      // Normalize code
      body.code = body.code.toUpperCase();

      // Check for duplicate code
      const existing = await TestPackage.findOne({ code: body.code });
      if (existing) {
        return NextResponse.json({ error: 'Package with this code already exists' }, { status: 409 });
      }

      // Validate all test IDs exist
      if (body.tests && body.tests.length > 0) {
        const testIds = body.tests.map((t: any) => t.testId);
        const existingTests = await Test.find({ _id: { $in: testIds } });
        if (existingTests.length !== testIds.length) {
          return NextResponse.json({
            error: 'One or more test IDs are invalid',
          }, { status: 400 });
        }
      }

      const pkg = await TestPackage.create(body);

      await auditUserAction(
        user.id, user.role, AuditAction.CREATE, 'TestPackage',
        pkg.packageId || pkg._id.toString(),
        `Created test package: ${pkg.name}`
      );

      return NextResponse.json({ success: true, data: pkg }, { status: 201 });
    } catch (error) {
      console.error('Create test package error:', error);
      return NextResponse.json({ error: 'Failed to create test package' }, { status: 500 });
    }
  }
);
