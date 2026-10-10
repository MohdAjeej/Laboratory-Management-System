import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { UserRole } from '@/lib/permissions';
import { createOrderSchema } from '@/lib/validation';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * POST /api/receptionist/orders
 * Create a new test order
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only receptionists and admins can create orders
    if (user.role !== UserRole.RECEPTIONIST && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the user's database ID
    const userDoc = await User.findOne({ email: user.email });
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the order
    const order = new Order({
      ...validationResult.data,
      createdBy: userDoc._id,
      status: 'CONFIRMED', // Set to confirmed immediately
      subtotal: 0, // Will be calculated by pre-save middleware
      discount: 0,
      tax: 0,
      total: 0, // Will be calculated by pre-save middleware
    });

    await order.save();

    // Populate the order with related data
    const populatedOrder = await Order.findById(order._id)
      .populate('patientId')
      .populate('items.testId')
      .populate('createdBy');

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/receptionist/orders
 * Get all orders (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only staff can view all orders
    if (user.role === UserRole.PATIENT) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    let query: any = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('patientId', 'patientId firstName lastName phone')
      .populate('items.testId', 'name code category price')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
      total,
      hasMore: skip + orders.length < total,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
