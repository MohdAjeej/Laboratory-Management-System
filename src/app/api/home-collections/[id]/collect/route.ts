import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import HomeCollection from '@/models/HomeCollection';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';

// POST /api/home-collections/[id]/collect — Mark as collected
export const POST = withPermissionAuth(
  [Permission.CREATE_SAMPLE],
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

      // Can only mark as collected if in transit
      if (collection.status !== 'IN_TRANSIT') {
        return NextResponse.json({ 
          success: false, 
          error: `Can only mark as collected when status is IN_TRANSIT` 
        }, { status: 400 });
      }

      // Update collection
      collection.status = 'COLLECTED';
      collection.actualCollectionTime = new Date();
      collection.events.push({
        event: 'Sample collected',
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
        AuditAction.SAMPLE_COLLECTED,
        'HomeCollection',
        collection.collectionId,
        'Sample collected successfully'
      );

      return NextResponse.json({ 
        success: true, 
        data: collection 
      });
    } catch (error) {
      console.error('Mark collected error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to mark collection as collected' 
      }, { status: 500 });
    }
  }
);
