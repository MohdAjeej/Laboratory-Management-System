import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import HomeCollection from '@/models/HomeCollection';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';

const scheduleCollectionSchema = z.object({
  scheduledDate: z.string().pipe(z.coerce.date()),
  scheduledTimeSlot: z.string().min(1, 'Time slot is required'),
});

// Valid status transitions
function canSchedule(currentStatus: string): boolean {
  return ['REQUESTED', 'FAILED'].includes(currentStatus);
}

// POST /api/home-collections/[id]/schedule — Schedule collection
export const POST = withPermissionAuth(
  [Permission.UPDATE_SAMPLE],
  true,
  async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validatedData = scheduleCollectionSchema.parse(body);

      const collection = await HomeCollection.findById(params.id);
      if (!collection) {
        return NextResponse.json({ 
          success: false, 
          error: 'Home collection not found' 
        }, { status: 404 });
      }

      // Check if can be scheduled
      if (!canSchedule(collection.status)) {
        return NextResponse.json({ 
          success: false, 
          error: `Cannot schedule collection in ${collection.status} status` 
        }, { status: 400 });
      }

      // Validate scheduled date is not in the past
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const scheduledDate = new Date(validatedData.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      
      if (scheduledDate < now) {
        return NextResponse.json({ 
          success: false, 
          error: 'Scheduled date cannot be in the past' 
        }, { status: 400 });
      }

      // Update collection
      collection.scheduledDate = validatedData.scheduledDate;
      collection.scheduledTimeSlot = validatedData.scheduledTimeSlot;
      collection.status = 'SCHEDULED';
      collection.events.push({
        event: 'Collection scheduled',
        userId: user.id,
        timestamp: new Date(),
        notes: `Scheduled for ${validatedData.scheduledDate.toLocaleDateString()} ${validatedData.scheduledTimeSlot}`,
      });

      await collection.save();
      await collection.populate([
        { path: 'orderId', select: 'orderId total status' },
        { path: 'patientId', select: 'firstName lastName phone patientId' },
      ]);

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.STATUS_CHANGED,
        'HomeCollection',
        collection.collectionId,
        `Scheduled collection for ${validatedData.scheduledDate.toLocaleDateString()} ${validatedData.scheduledTimeSlot}`,
        { scheduledDate: validatedData.scheduledDate, timeSlot: validatedData.scheduledTimeSlot }
      );

      return NextResponse.json({ 
        success: true, 
        data: collection 
      });
    } catch (error) {
      console.error('Schedule home collection error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to schedule home collection' 
      }, { status: 500 });
    }
  }
);
