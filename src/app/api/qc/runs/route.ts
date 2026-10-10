import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import { QCRun, QCLot } from '@/models/QualityControl';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { mongoIdSchema } from '@/lib/validation';

// Validation schema
const createQCRunSchema = z.object({
  qcLotId: mongoIdSchema,
  equipmentId: mongoIdSchema.optional(),
  measuredValue: z.number(),
  notes: z.string().optional(),
  correctiveAction: z.string().optional(),
});

// GET /api/qc/runs - List QC runs
export const GET = withPermissionAuth(
  [Permission.READ_QC],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
      const qcLotId = searchParams.get('qcLotId') || '';
      const testId = searchParams.get('testId') || '';
      const result = searchParams.get('result') || '';
      const fromDate = searchParams.get('fromDate') || '';
      const toDate = searchParams.get('toDate') || '';

      const query: any = {};

      if (qcLotId) query.qcLotId = qcLotId;
      if (testId) query.testId = testId;
      if (result) query.result = result;

      if (fromDate || toDate) {
        query.performedAt = {};
        if (fromDate) {
          const start = new Date(fromDate);
          start.setHours(0, 0, 0, 0);
          query.performedAt.$gte = start;
        }
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          query.performedAt.$lte = end;
        }
      }

      const skip = (page - 1) * limit;

      const [runs, total] = await Promise.all([
        QCRun.find(query)
          .populate('qcLotId', 'lotId name lotNumber')
          .populate('testId', 'name code')
          .populate('equipmentId', 'name equipmentId')
          .populate('performedBy', 'firstName lastName')
          .populate('reviewedBy', 'firstName lastName')
          .sort({ performedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        QCRun.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          runs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get QC runs error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch QC runs',
      }, { status: 500 });
    }
  }
);

// POST /api/qc/runs - Record QC run
export const POST = withPermissionAuth(
  [Permission.CREATE_QC],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validatedData = createQCRunSchema.parse(body);

      // Get QC lot to validate and get parameters
      const qcLot = await QCLot.findById(validatedData.qcLotId);
      
      if (!qcLot) {
        return NextResponse.json({
          success: false,
          error: 'QC lot not found',
        }, { status: 404 });
      }

      if (qcLot.status !== 'ACTIVE') {
        return NextResponse.json({
          success: false,
          error: 'QC lot is not active',
        }, { status: 400 });
      }

      // Check if expired
      if (new Date() > qcLot.expiryDate) {
        return NextResponse.json({
          success: false,
          error: 'QC lot has expired',
        }, { status: 400 });
      }

      // Create QC run - result and deviation will be calculated in pre-save hook
      const run = await QCRun.create({
        ...validatedData,
        testId: qcLot.testId,
        targetValue: qcLot.targetValue,
        acceptableMin: qcLot.acceptableMin,
        acceptableMax: qcLot.acceptableMax,
        unit: qcLot.unit,
        performedBy: user.id,
        performedAt: new Date(),
      });

      await run.populate([
        { path: 'qcLotId', select: 'lotId name lotNumber' },
        { path: 'testId', select: 'name code' },
        { path: 'equipmentId', select: 'name equipmentId' },
        { path: 'performedBy', select: 'firstName lastName' },
      ]);

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.CREATE,
        'QCRun',
        run.runId,
        `Recorded QC run: ${run.result}`,
        {
          qcLotId: qcLot.lotId,
          measuredValue: run.measuredValue,
          result: run.result,
        }
      );

      // If failed, send alert notification (would integrate with notification system)
      if (run.result === 'FAIL') {
        console.warn(`QC Failure Alert: ${qcLot.name} - ${run.measuredValue} ${run.unit}`);
        // TODO: Create notification record
      }

      return NextResponse.json({
        success: true,
        data: run,
      }, { status: 201 });
    } catch (error) {
      console.error('Create QC run error:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to record QC run',
      }, { status: 500 });
    }
  }
);
