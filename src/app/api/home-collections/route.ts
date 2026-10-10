import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import HomeCollection from '@/models/HomeCollection';
import Order from '@/models/Order';
import Patient from '@/models/Patient';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { mongoIdSchema } from '@/lib/validation';

// Validation schemas
const createHomeCollectionSchema = z.object({
  orderId: mongoIdSchema,
  patientId: mongoIdSchema,
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    area: z.string().min(1, 'Area is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().min(4, 'Pincode is required'),
    landmark: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  contactPhone: z.string().min(10, 'Valid phone number is required'),
  alternatePhone: z.string().optional(),
  preferredDate: z.string().pipe(z.coerce.date()),
  preferredTimeSlot: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']),
  specialInstructions: z.string().optional(),
  preparationNotes: z.string().optional(),
  collectionCharge: z.number().min(0).default(0),
});

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

// GET /api/home-collections — List with filters
export const GET = withPermissionAuth(
  [Permission.READ_SAMPLE],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const status = searchParams.get('status') || '';
      const assignedTo = searchParams.get('assignedTo') || '';
      const city = searchParams.get('city') || '';
      const pincode = searchParams.get('pincode') || '';
      const fromDate = searchParams.get('fromDate') || '';
      const toDate = searchParams.get('toDate') || '';

      const query: any = {};

      if (status) query.status = status;
      if (assignedTo) query.assignedTo = assignedTo;
      if (city) query['address.city'] = { $regex: city, $options: 'i' };
      if (pincode) query['address.pincode'] = pincode;
      
      if (fromDate || toDate) {
        query.preferredDate = {};
        if (fromDate) {
          const start = new Date(fromDate);
          start.setHours(0, 0, 0, 0);
          query.preferredDate.$gte = start;
        }
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          query.preferredDate.$lte = end;
        }
      }

      const skip = (page - 1) * limit;

      const [collections, total] = await Promise.all([
        HomeCollection.find(query)
          .populate('orderId', 'orderId total status')
          .populate('patientId', 'firstName lastName phone patientId')
          .populate('assignedTo', 'firstName lastName phone')
          .sort({ preferredDate: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        HomeCollection.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          collections,
          pagination: { 
            page, 
            limit, 
            total, 
            pages: Math.ceil(total / limit) 
          },
        },
      });
    } catch (error) {
      console.error('Get home collections error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch home collections' 
      }, { status: 500 });
    }
  }
);

// POST /api/home-collections — Create
export const POST = withPermissionAuth(
  [Permission.CREATE_SAMPLE],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validatedData = createHomeCollectionSchema.parse(body);

      // Verify order exists
      const order = await Order.findById(validatedData.orderId);
      if (!order) {
        return NextResponse.json({ 
          success: false, 
          error: 'Order not found' 
        }, { status: 404 });
      }

      // Verify patient exists and matches order
      const patient = await Patient.findById(validatedData.patientId);
      if (!patient) {
        return NextResponse.json({ 
          success: false, 
          error: 'Patient not found' 
        }, { status: 404 });
      }

      if (order.patientId.toString() !== validatedData.patientId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Patient does not match order' 
        }, { status: 400 });
      }

      // Check if collection request already exists for this order
      const existing = await HomeCollection.findOne({ orderId: validatedData.orderId });
      if (existing) {
        return NextResponse.json({ 
          success: false, 
          error: 'Home collection request already exists for this order' 
        }, { status: 409 });
      }

      // Validate preferred date is not in the past
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const preferredDate = new Date(validatedData.preferredDate);
      preferredDate.setHours(0, 0, 0, 0);
      
      if (preferredDate < now) {
        return NextResponse.json({ 
          success: false, 
          error: 'Preferred date cannot be in the past' 
        }, { status: 400 });
      }

      // Create collection request
      const collection = await HomeCollection.create({
        ...validatedData,
        events: [{
          event: 'Collection request created',
          userId: user.id,
          timestamp: new Date(),
        }],
      });

      await collection.populate([
        { path: 'orderId', select: 'orderId total' },
        { path: 'patientId', select: 'firstName lastName phone patientId' },
      ]);

      await auditUserAction(
        user.id, 
        user.role, 
        AuditAction.CREATE, 
        'HomeCollection',
        collection.collectionId,
        `Created home collection request for patient ${patient.firstName} ${patient.lastName}`,
        { orderId: order.orderId, patientId: patient.patientId }
      );

      return NextResponse.json({ 
        success: true, 
        data: collection 
      }, { status: 201 });
    } catch (error) {
      console.error('Create home collection error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create home collection' 
      }, { status: 500 });
    }
  }
);
