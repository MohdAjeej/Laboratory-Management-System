import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import HomeCollection from '@/models/HomeCollection';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';

// POST /api/home-collections/[id]/transit — Mark as in transit
export const POST = withPermissionAuth(
  [Permission.UPDATE_SAMPLE],
  true,
  async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      await connectToDatabase();

      const collection = await HomeCollection.findById(params.id);
      if (!collection) {
        return NextResponse.json({ 
          success: false, 
          error: 'Home collection not found' 
        }, { status: 404 });
      }

      // Can only mark in transit if assigned
      if (collection.status !== 'ASSIGNED') {
        return NextResponse.json({ 
          success: false, 
          error: `Can only mark in transit when status is ASSIGNED` 
        }, { status: 400 });
      }

      // Update collection
      collection.status = 'IN_TRANSIT';
      collection.events.push({
        event: 'Collector in transit',
        userId: user.id,
        timestamp: new Date(),
      });

      await collection.save();
      await collection.populate([
        { path: 'orderId', select: 'orderId total status' },
        { path: 'patientId', select: 'firstName lastName phone patientId' },
        { path: 'assignedTo', select: 'firstName lastName phone' },
      ]);

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.STATUS_CHANGED,
        'HomeCollection',
        collection.collectionId,
        'Collector is on the way'
      );

      return NextResponse.json({ 
        success: true, 
        data: collection 
      });
    } catch (error) {
      console.error('Mark in transit error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to mark collection in transit' 
      }, { status: 500 });
    }
  }
);
