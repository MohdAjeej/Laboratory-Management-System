import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import Equipment from '@/models/Equipment';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';

// Validation schema
const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  code: z.string().min(1, 'Equipment code is required').toUpperCase(),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  modelName: z.string().min(1, 'Model is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  purchaseDate: z.string().pipe(z.coerce.date()),
  purchaseCost: z.number().min(0),
  location: z.string().min(1, 'Location is required'),
  department: z.string().min(1, 'Department is required'),
  category: z.enum(['ANALYZER', 'CENTRIFUGE', 'MICROSCOPE', 'INCUBATOR', 'REFRIGERATOR', 'AUTOCLAVE', 'OTHER']),
  calibrationFrequency: z.number().min(1).optional(),
  maintenanceFrequency: z.number().min(1).optional(),
  warrantyExpiryDate: z.string().pipe(z.coerce.date()).optional(),
  specifications: z.string().optional(),
  operatingProcedure: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/equipment - List equipment
export const GET = withPermissionAuth(
  [Permission.READ_EQUIPMENT],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const category = searchParams.get('category') || '';
      const status = searchParams.get('status') || '';
      const location = searchParams.get('location') || '';
      const search = searchParams.get('search') || '';
      const maintenanceDue = searchParams.get('maintenanceDue') === 'true';
      const calibrationDue = searchParams.get('calibrationDue') === 'true';

      const query: any = { isActive: true };

      if (category) query.category = category;
      if (status) query.status = status;
      if (location) query.location = { $regex: location, $options: 'i' };
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { equipmentId: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } },
        ];
      }

      if (maintenanceDue) {
        query.nextMaintenanceDate = { $lte: new Date() };
      }

      if (calibrationDue) {
        query.nextCalibrationDate = { $lte: new Date() };
      }

      const skip = (page - 1) * limit;

      const [equipment, total] = await Promise.all([
        Equipment.find(query)
          .populate('supplier', 'name supplierId')
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Equipment.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          equipment,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get equipment error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch equipment',
      }, { status: 500 });
    }
  }
);

// POST /api/equipment - Create equipment
export const POST = withPermissionAuth(
  [Permission.CREATE_EQUIPMENT],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validatedData = createEquipmentSchema.parse(body);

      // Check for duplicate code or serial number
      const existing = await Equipment.findOne({
        $or: [
          { code: validatedData.code },
          { serialNumber: validatedData.serialNumber },
        ],
        isActive: true,
      });

      if (existing) {
        const field = existing.code === validatedData.code ? 'code' : 'serial number';
        return NextResponse.json({
          success: false,
          error: `Equipment with this ${field} already exists`,
        }, { status: 409 });
      }

      // Create equipment
      const equipment = await Equipment.create({
        ...validatedData,
        createdBy: user.id,
        status: 'OPERATIONAL',
      });

      await equipment.populate('supplier', 'name supplierId');

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.CREATE,
        'Equipment',
        equipment.equipmentId,
        `Created equipment: ${equipment.name}`,
        { code: equipment.code, serialNumber: equipment.serialNumber }
      );

      return NextResponse.json({
        success: true,
        data: equipment,
      }, { status: 201 });
    } catch (error) {
      console.error('Create equipment error:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to create equipment',
      }, { status: 500 });
    }
  }
);
