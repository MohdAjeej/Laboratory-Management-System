import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import Patient from '@/models/Patient';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/lib/permissions';

// GET /api/hospital/orders - Get hospital orders
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    await connectToDatabase();

    // Check if user is hospital staff
    if (user.role !== UserRole.HOSPITAL_STAFF || !user.hospitalId) {
      return NextResponse.json(
        { error: 'Access denied - Hospital staff only' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const query: any = { hospitalId: user.hospitalId };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('patientId', 'firstName lastName patientId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    // Enhance orders with patient names and test count
    const enhancedOrders = orders.map((order: any) => ({
      ...order,
      patientName: order.patientId
        ? `${order.patientId.firstName} ${order.patientId.lastName}`
        : 'Unknown Patient',
      patientIdStr: order.patientId?.patientId || 'N/A',
      testCount: order.tests?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: enhancedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get hospital orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospital orders' },
      { status: 500 }
    );
  }
});
