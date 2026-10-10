import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import HomeCollection from '@/models/HomeCollection';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';

const failCollectionSchema = z.object({
  failureReason: z.string().min(1, 'Failure reason is required'),
});

// POST /api/home-collections/[id]/fail — Mark as failed
export const POST = withPermissionAuth(
  [Permission.UPDATE_SAMPLE],
  true,
  async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validatedData = failCollectionSchema.parse(body);

      const collection = await HomeCollection.findById(params.id);
      if (!collection) {
        return NextResponse.json({ 
          success: false, 
          error: 'Home collection not found' 
        }, { status: 404 });
      }

      // Can only fail if in transit
      if (collection.status !== 'IN_TRANSIT') {
        return NextResponse.json({ 
          success: false, 
          error: `Can only mark as failed when in transit` 
        }, { status: 400 });
      }

      // Update collection
      collection.status = 'FAILED';
      collection.failureReason = validatedData.failureReason;
      collection.events.push({
        event: 'Collection failed',
        userId: user.id,
        timestamp: new Date(),
        notes: validatedData.failureReason,
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
        `Collection failed: ${validatedData.failureReason}`,
        { failureReason: validatedData.failureReason }
      );

      return NextResponse.json({ 
        success: true, 
        data: collection 
      });
    } catch (error) {
      console.error('Mark failed error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to mark collection as failed' 
      }, { status: 500 });
    }
  }
);
