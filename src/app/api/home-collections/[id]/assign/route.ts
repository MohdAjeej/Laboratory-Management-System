import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import HomeCollection from '@/models/HomeCollection';
import User from '@/models/User';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission, UserRole } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { mongoIdSchema } from '@/lib/validation';

const assignCollectorSchema = z.object({
  assignedTo: mongoIdSchema,
});

// POST /api/home-collections/[id]/assign — Assign to phlebotomist
export const POST = withPermissionAuth(
  [Permission.UPDATE_SAMPLE],
  true,
  async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validatedData = assignCollectorSchema.parse(body);

      const collection = await HomeCollection.findById(params.id);
      if (!collection) {
        return NextResponse.json({ 
          success: false, 
          error: 'Home collection not found' 
        }, { status: 404 });
      }

      // Can only assign if scheduled
      if (collection.status !== 'SCHEDULED') {
        return NextResponse.json({ 
          success: false, 
          error: `Can only assign collectors to scheduled collections` 
        }, { status: 400 });
      }

      // Verify assigned user exists and is a technician
      const assignedUser = await User.findById(validatedData.assignedTo);
      if (!assignedUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Assigned user not found' 
        }, { status: 404 });
      }

      if (assignedUser.role !== UserRole.TECHNICIAN) {
        return NextResponse.json({ 
          success: false, 
          error: 'Can only assign to technicians/phlebotomists' 
        }, { status: 400 });
      }

      if (!assignedUser.isActive) {
        return NextResponse.json({ 
          success: false, 
          error: 'Cannot assign to inactive user' 
        }, { status: 400 });
      }

      // Update collection
      collection.assignedTo = validatedData.assignedTo;
      collection.status = 'ASSIGNED';
      collection.events.push({
        event: 'Collector assigned',
        userId: user.id,
        timestamp: new Date(),
        notes: `Assigned to ${assignedUser.firstName} ${assignedUser.lastName}`,
      });

      await collection.save();
      await collection.populate([
        { path: 'orderId', select: 'orderId total status' },
        { path: 'patientId', select: 'firstName lastName phone patientId' },
        { path: 'assignedTo', select: 'firstName lastName phone email' },
      ]);

      await auditUserAction(
        user.id,
        user.role,
        AuditAction.STATUS_CHANGED,
        'HomeCollection',
        collection.collectionId,
        `Assigned to ${assignedUser.firstName} ${assignedUser.lastName}`,
        { assignedTo: assignedUser.email }
      );

      return NextResponse.json({ 
        success: true, 
        data: collection 
      });
    } catch (error) {
      console.error('Assign home collection error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to assign home collection' 
      }, { status: 500 });
    }
  }
);
