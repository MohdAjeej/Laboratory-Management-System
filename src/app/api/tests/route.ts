import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Test from '@/models/Test';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validateTest } from '@/lib/validators/masterData';

// GET /api/tests — List tests with search/pagination/filters
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
      const department = searchParams.get('department') || '';
      const sampleType = searchParams.get('sampleType') || '';
      const isActive = searchParams.get('isActive');
      const sort = searchParams.get('sort') || 'category';
      const order = searchParams.get('order') === 'asc' ? 1 : -1;

      const query: any = {};

      if (search) {
        query.$or = [
          { testId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }

      if (category) query.category = { $regex: category, $options: 'i' };
      if (department) query.department = { $regex: department, $options: 'i' };
      if (sampleType) query.sampleType = { $regex: sampleType, $options: 'i' };
      if (isActive !== null && isActive !== '' && isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const skip = (page - 1) * limit;
      const sortObj: any = {};
      sortObj[sort] = order;

      const [tests, total] = await Promise.all([
        Test.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Test.countDocuments(query),
      ]);

      // Get unique categories and departments for filter dropdowns
      const [categories, departments, sampleTypes] = await Promise.all([
        Test.distinct('category', { isActive: true }),
        Test.distinct('department', { isActive: true }),
        Test.distinct('sampleType', { isActive: true }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          tests,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
          filters: { categories, departments, sampleTypes },
        },
      });
    } catch (error) {
      console.error('Get tests error:', error);
      return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
    }
  }
);

// POST /api/tests — Create test
export const POST = withPermissionAuth(
  [Permission.CREATE_TEST],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validation = validateTest(body);
      if (validation.hasErrors()) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 400 });
      }

      // Normalize code to uppercase
      body.code = body.code.toUpperCase();

      // Check duplicate code
      const existing = await Test.findOne({ code: body.code });
      if (existing) {
        return NextResponse.json({ error: 'Test with this code already exists' }, { status: 409 });
      }

      const test = await Test.create(body);

      await auditUserAction(
        user.id, user.role, AuditAction.CREATE, 'Test',
        test.testId || test._id.toString(),
        `Created test: ${test.name} (${test.code})`
      );

      return NextResponse.json({ success: true, data: test }, { status: 201 });
    } catch (error) {
      console.error('Create test error:', error);
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
    }
  }
);
