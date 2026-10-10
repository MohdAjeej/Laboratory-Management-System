import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import { InventoryItem } from '@/models/Inventory';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';

// Validation schemas
const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200),
  category: z.enum(['REAGENT', 'CONSUMABLE', 'CHEMICAL', 'GLASSWARE', 'OTHER']),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required (e.g., ml, pcs, kg)'),
  minimumStock: z.number().min(0).default(0),
  maximumStock: z.number().min(0).optional(),
  location: z.string().optional(),
  linkedTestIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
}).refine(data => {
  if (data.maximumStock !== undefined) {
    return data.maximumStock >= data.minimumStock;
  }
  return true;
}, {
  message: 'Maximum stock must be greater than or equal to minimum stock',
  path: ['maximumStock'],
});

// GET /api/inventory — List items with filters
export const GET = withPermissionAuth(
  [Permission.READ_INVENTORY],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
      const category = searchParams.get('category') || '';
      const lowStock = searchParams.get('lowStock') === 'true';
      const expiring = searchParams.get('expiring') === 'true';
      const search = searchParams.get('search') || '';

      const query: any = { isActive: true };

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { itemId: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (lowStock) {
        query.$expr = { $lte: ['$currentStock', '$minimumStock'] };
      }

      const skip = (page - 1) * limit;

      let items;
      let total;

      if (expiring) {
        // Get items with expiring batches (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        items = await InventoryItem.find({
          ...query,
          'batches.expiryDate': { $lte: thirtyDaysFromNow },
          'batches.status': 'ACTIVE',
        })
          .select('itemId name category currentStock minimumStock unit location batches')
          .sort({ 'batches.expiryDate': 1 })
          .skip(skip)
          .limit(limit)
          .lean();

        total = await InventoryItem.countDocuments({
          ...query,
          'batches.expiryDate': { $lte: thirtyDaysFromNow },
          'batches.status': 'ACTIVE',
        });
      } else {
        items = await InventoryItem.find(query)
          .select('itemId name category currentStock minimumStock unit location')
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .lean();

        total = await InventoryItem.countDocuments(query);
      }

      // Add low stock flag to each item
      const itemsWithFlags = items.map((item: any) => ({
        ...item,
        isLowStock: item.currentStock <= item.minimumStock,
      }));

      return NextResponse.json({
        success: true,
        data: {
          items: itemsWithFlags,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get inventory items error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch inventory items',
      }, { status: 500 });
    }
  }
);

// POST /api/inventory — Create new item
export const POST = withPermissionAuth(
  [Permission.CREATE_INVENTORY],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validatedData = createInventoryItemSchema.parse(body);

      // Check if item with same name already exists
      const existing = await InventoryItem.findOne({
        name: validatedData.name,
        isActive: true,
      });

      if (existing) {
        return NextResponse.json({
          success: false,
          error: 'Inventory item with this name already exists',
        }, { status: 409 });
      }

      // Create item
      const item = await InventoryItem.create({
        ...validatedData,
        currentStock: 0,
        batches: [],
        transactions: [],
      });

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.CREATE,
        'InventoryItem',
        item.itemId,
        `Created inventory item: ${item.name}`,
        { category: item.category, unit: item.unit }
      );

      return NextResponse.json({
        success: true,
        data: item,
      }, { status: 201 });
    } catch (error) {
      console.error('Create inventory item error:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to create inventory item',
      }, { status: 500 });
    }
  }
);
