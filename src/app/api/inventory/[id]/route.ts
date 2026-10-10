import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { InventoryItem } from '@/models/Inventory';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';

// GET /api/inventory/[id]
export const GET = withPermissionAuth(
  [Permission.READ_INVENTORY],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;

      const item = await InventoryItem.findById(id)
        .populate('batches.supplierId', 'name contactPerson phone')
        .populate('linkedTestIds', 'name code')
        .lean();

      if (!item) {
        return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: item });
    } catch (error) {
      console.error('Get inventory item error:', error);
      return NextResponse.json({ error: 'Failed to fetch inventory item' }, { status: 500 });
    }
  }
);

// PUT /api/inventory/[id] — Update or stock transaction
export const PUT = withPermissionAuth(
  [Permission.UPDATE_INVENTORY],
  true,
  async (request: NextRequest, user: any, context: any) => {
    try {
      await connectToDatabase();
      const { id } = await context.params;
      const body = await request.json();

      const item = await InventoryItem.findById(id);
      if (!item) {
        return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
      }

      // Stock transactions
      if (body.action === 'stock_in') {
        await item.addStock(
          body.quantity, body.batchNumber, new Date(body.purchaseDate),
          new Date(body.expiryDate), body.unitCost, user.id, body.supplierId
        );
        await auditUserAction(user.id, user.role, AuditAction.UPDATE, 'InventoryItem', item.itemId, `Stock in: +${body.quantity} ${item.unit}`);
      } else if (body.action === 'stock_out') {
        await item.removeStock(body.quantity, user.id, body.reason, body.batchNumber);
        await auditUserAction(user.id, user.role, AuditAction.UPDATE, 'InventoryItem', item.itemId, `Stock out: -${body.quantity} ${item.unit}`);
      } else if (body.action === 'adjust') {
        await item.adjustStock(body.quantity, user.id, body.reason);
        await auditUserAction(user.id, user.role, AuditAction.UPDATE, 'InventoryItem', item.itemId, `Stock adjustment: ${body.quantity > 0 ? '+' : ''}${body.quantity} ${item.unit}`);
      } else {
        // General field update
        Object.assign(item, body);
        await item.save();
        await auditUserAction(user.id, user.role, AuditAction.UPDATE, 'InventoryItem', item.itemId, `Updated inventory item: ${item.name}`);
      }

      return NextResponse.json({ success: true, data: item });
    } catch (error: any) {
      console.error('Update inventory error:', error);
      return NextResponse.json({ error: error.message || 'Failed to update inventory item' }, { status: 500 });
    }
  }
);
