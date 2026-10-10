import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import Hospital from '@/models/Hospital';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/lib/permissions';

// GET /api/hospital/stats - Get hospital statistics
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

    const hospitalId = user.hospitalId;

    // Get hospital info for credit limit
    const hospital = await Hospital.findById(hospitalId).lean();

    // Calculate statistics
    const [totalOrders, pendingOrders, completedOrders, billingData] = await Promise.all([
      // Total orders
      Order.countDocuments({ hospitalId }),
      
      // Pending orders
      Order.countDocuments({ 
        hospitalId, 
        status: { $in: ['pending', 'sample_collected', 'in_progress'] } 
      }),
      
      // Completed orders
      Order.countDocuments({ 
        hospitalId, 
        status: { $in: ['completed', 'delivered'] } 
      }),
      
      // Billing data for current month
      Order.aggregate([
        {
          $match: {
            hospitalId: hospital?._id,
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalBilling: { $sum: '$totalAmount' },
            pendingPayments: {
              $sum: {
                $cond: [
                  { $eq: ['$paymentStatus', 'pending'] },
                  '$totalAmount',
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const billing = billingData[0] || { totalBilling: 0, pendingPayments: 0 };

    // Calculate credit used (pending + overdue payments)
    const creditUsedData = await Order.aggregate([
      {
        $match: {
          hospitalId: hospital?._id,
          paymentStatus: { $in: ['pending', 'overdue'] },
        },
      },
      {
        $group: {
          _id: null,
          creditUsed: { $sum: '$totalAmount' },
        },
      },
    ]);

    const creditUsed = creditUsedData[0]?.creditUsed || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalBilling: billing.totalBilling,
        pendingPayments: billing.pendingPayments,
        creditUsed,
        creditLimit: hospital?.creditLimit || 100000,
      },
    });
  } catch (error) {
    console.error('Get hospital stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospital statistics' },
      { status: 500 }
    );
  }
});
