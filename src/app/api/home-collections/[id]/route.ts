import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import HomeCollection from '@/models/HomeCollection';
import User from '@/models/User';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, auditDataChange, AuditAction } from '@/lib/audit';
import { mongoIdSchema } from '@/lib/validation';

// Validation schemas
const scheduleCollectionSchema = z.object({
  scheduledDate: z.string().pipe(z.coerce.date()),
  scheduledTimeSlot: z.string().min(1, 'Time slot is required'),
});

const assignCollectorSchema = z.object({
  assignedTo: mongoIdSchema,
});

const cancelCollectionSchema = z.object({
  cancellationReason: z.string().min(1, 'Cancellation reason is required'),
});

const failCollectionSchema = z.object({
  failureReason: z.string().min(1, 'Failure reason is required'),
});

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  'REQUESTED': ['SCHEDULED', 'CANCELLED'],
  'SCHEDULED': ['ASSIGNED', 'CANCELLED'],
  'ASSIGNED': ['IN_TRANSIT', 'CANCELLED'],
  'IN_TRANSIT': ['COLLECTED', 'FAILED', 'CANCELLED'],
  'COLLECTED': [],
  'CANCELLED': [],
  'FAILED': ['SCHEDULED'], // Can be rescheduled after failure
};

function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

// GET /api/home-collections/[id] — Retrieve single collection
export const GET = withPermissionAuth(
  [Permission.READ_SAMPLE],
  true,
  async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      await connectToDatabase();

      const collection = await HomeCollection.findById(params.id)
        .populate('orderId', 'orderId total status items')
        .populate('patientId', 'firstName lastName phone patientId email address')
        .populate('assignedTo', 'firstName lastName phone email')
        .populate('events.userId', 'firstName lastName')
        .lean();

      if (!collection) {
        return NextResponse.json({ 
          success: false, 
          error: 'Home collection not found' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        data: collection 
      });
    } catch (error) {
      console.error('Get home collection error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch home collection' 
      }, { status: 500 });
    }
  }
);

// PUT /api/home-collections/[id] — Update collection (reschedule)
export const PUT = withPermissionAuth(
  [Permission.UPDATE_SAMPLE],
  true,
  async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      const collection = await HomeCollection.findById(params.id);
      if (!collection) {
        return NextResponse.json({ 
          success: false, 
          error: 'Home collection not found' 
        }, { status: 404 });
      }

      // Only allow updates if status allows it
      if (['COLLECTED', 'CANCELLED'].includes(collection.status)) {
        return NextResponse.json({ 
          success: false, 
          error: `Cannot update collection in ${collection.status} status` 
        }, { status: 400 });
      }

      // Validate and update fields
      const allowedUpdates = ['preferredDate', 'preferredTimeSlot', 'contactPhone', 
                             'alternatePhone', 'specialInstructions', 'preparationNotes'];
      
      const oldValues: any = {};
      const newValues: any = {};
      
      for (const key of allowedUpdates) {
        if (body[key] !== undefined) {
          oldValues[key] = (collection as any)[key];
          (collection as any)[key] = body[key];
          newValues[key] = body[key];
        }
      }

      // If updating preferred date, validate it's not in the past
      if (body.preferredDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const newDate = new Date(body.preferredDate);
        newDate.setHours(0, 0, 0, 0);
        
        if (newDate < now) {
          return NextResponse.json({ 
            success: false, 
            error: 'Preferred date cannot be in the past' 
          }, { status: 400 });
        }
      }

      collection.events.push({
        event: 'Collection details updated',
        userId: user.id,
        timestamp: new Date(),
        notes: `Updated: ${Object.keys(newValues).join(', ')}`,
      });

      await collection.save();
      await collection.populate([
        { path: 'orderId', select: 'orderId total status' },
        { path: 'patientId', select: 'firstName lastName phone patientId' },
        { path: 'assignedTo', select: 'firstName lastName phone' },
      ]);

      await auditDataChange(
        user.id,
        user.role,
        AuditAction.UPDATE,
        'HomeCollection',
        collection.collectionId,
        'Updated home collection details',
        oldValues,
        newValues
      );

      return NextResponse.json({ 
        success: true, 
        data: collection 
      });
    } catch (error) {
      console.error('Update home collection error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update home collection' 
      }, { status: 500 });
    }
  }
);

// DELETE /api/home-collections/[id] — Cancel collection
export const DELETE = withPermissionAuth(
  [Permission.DELETE_SAMPLE],
  true,
  async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      await connectToDatabase();
      const { searchParams } = new URL(request.url);
      const reason = searchParams.get('reason') || 'Cancelled by user';

      const collection = await HomeCollection.findById(params.id);
      if (!collection) {
        return NextResponse.json({ 
          success: false, 
          error: 'Home collection not found' 
        }, { status: 404 });
      }

      // Check if already cancelled or collected
      if (collection.status === 'CANCELLED') {
        return NextResponse.json({ 
          success: false, 
          error: 'Collection is already cancelled' 
        }, { status: 400 });
      }

      if (collection.status === 'COLLECTED') {
        return NextResponse.json({ 
          success: false, 
          error: 'Cannot cancel collected sample' 
        }, { status: 400 });
      }

      // Validate transition
      if (!canTransitionTo(collection.status, 'CANCELLED')) {
        return NextResponse.json({ 
          success: false, 
          error: `Cannot cancel collection from ${collection.status} status` 
        }, { status: 400 });
      }

      collection.status = 'CANCELLED';
      collection.cancellationReason = reason;
      collection.events.push({
        event: 'Collection cancelled',
        userId: user.id,
        timestamp: new Date(),
        notes: reason,
      });

      await collection.save();

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.STATUS_CHANGED,
        'HomeCollection',
        collection.collectionId,
        `Cancelled home collection: ${reason}`,
        { oldStatus: collection.status, newStatus: 'CANCELLED', reason }
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Home collection cancelled successfully' 
      });
    } catch (error) {
      console.error('Cancel home collection error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to cancel home collection' 
      }, { status: 500 });
    }
  }
);
