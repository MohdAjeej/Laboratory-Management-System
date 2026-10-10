import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import { QCLot } from '@/models/QualityControl';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { mongoIdSchema } from '@/lib/validation';

// Validation schema
const createQCLotSchema = z.object({
  name: z.string().min(1, 'QC lot name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  lotNumber: z.string().min(1, 'Lot number is required'),
  testId: mongoIdSchema,
  parameterId: mongoIdSchema.optional(),
  equipmentId: mongoIdSchema.optional(),
  targetValue: z.number(),
  acceptableMin: z.number(),
  acceptableMax: z.number(),
  unit: z.string().min(1, 'Unit is required'),
  expiryDate: z.string().pipe(z.coerce.date()),
  openDate: z.string().pipe(z.coerce.date()).optional(),
}).refine(data => data.acceptableMax > data.acceptableMin, {
  message: 'Maximum value must be greater than minimum',
  path: ['acceptableMax'],
});

// GET /api/qc/lots - List QC lots
export const GET = withPermissionAuth(
  [Permission.READ_QC],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const testId = searchParams.get('testId') || '';
      const status = searchParams.get('status') || '';
      const expiring = searchParams.get('expiring') === 'true';

      const query: any = { isActive: true };

      if (testId) query.testId = testId;
      if (status) query.status = status;

      if (expiring) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        query.expiryDate = { $lte: thirtyDaysFromNow };
        query.status = 'ACTIVE';
      }

      const skip = (page - 1) * limit;

      const [lots, total] = await Promise.all([
        QCLot.find(query)
          .populate('testId', 'name code')
          .populate('equipmentId', 'name equipmentId')
          .sort({ expiryDate: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        QCLot.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          lots,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get QC lots error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch QC lots',
      }, { status: 500 });
    }
  }
);

// POST /api/qc/lots - Create QC lot
export const POST = withPermissionAuth(
  [Permission.CREATE_QC],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validatedData = createQCLotSchema.parse(body);

      // Check expiry date is in future
      const now = new Date();
      const expiryDate = new Date(validatedData.expiryDate);
      
      if (expiryDate <= now) {
        return NextResponse.json({
          success: false,
          error: 'Expiry date must be in the future',
        }, { status: 400 });
      }

      // Create QC lot
      const lot = await QCLot.create({
        ...validatedData,
        status: 'ACTIVE',
      });

      await lot.populate([
        { path: 'testId', select: 'name code' },
        { path: 'equipmentId', select: 'name equipmentId' },
      ]);

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.CREATE,
        'QCLot',
        lot.lotId,
        `Created QC lot: ${lot.name}`,
        { lotNumber: lot.lotNumber, testId: lot.testId }
      );

      return NextResponse.json({
        success: true,
        data: lot,
      }, { status: 201 });
    } catch (error) {
      console.error('Create QC lot error:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to create QC lot',
      }, { status: 500 });
    }
  }
);
