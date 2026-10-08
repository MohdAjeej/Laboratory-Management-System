import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import TestResult from '@/models/TestResult';
import Report from '@/models/Report';
import Patient from '@/models/Patient';
import { UserRole } from '@/lib/permissions';
import { OrderStatus, ResultStatus, ReportStatus } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/stats
 * Fetch statistics for the authenticated patient's dashboard
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

    // Only patients can access this endpoint
    if (user.role !== UserRole.PATIENT) {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for patients only.' },
        { status: 403 }
      );
    }

    await connectDB();

    // Find patient record by user email
    const patient = await Patient.findOne({ email: user.email });
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient record not found' },
        { status: 404 }
      );
    }

    // Get all statistics in parallel
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalResults,
      criticalResults,
      totalReports,
      recentOrders,
      recentResults,
    ] = await Promise.all([
      // Total orders
      Order.countDocuments({ patientId: patient._id }),
      
      // Pending orders (not completed or cancelled)
      Order.countDocuments({ 
        patientId: patient._id,
        status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
      }),
      
      // Completed orders
      Order.countDocuments({ 
        patientId: patient._id,
        status: OrderStatus.COMPLETED
      }),
      
      // Total verified results
      TestResult.countDocuments({ 
        patientId: patient._id,
        status: ResultStatus.VERIFIED
      }),
      
      // Critical results
      TestResult.countDocuments({ 
        patientId: patient._id,
        status: ResultStatus.CRITICAL
      }),
      
      // Total published reports
      Report.countDocuments({ 
        patientId: patient._id,
        status: { $in: [ReportStatus.PUBLISHED, ReportStatus.DOWNLOADED] }
      }),
      
      // Recent orders (last 5)
      Order.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('items.testId', 'name')
        .select('orderId status createdAt items')
        .lean(),
      
      // Recent results (last 5 verified)
      TestResult.find({ 
        patientId: patient._id,
        status: ResultStatus.VERIFIED
      })
        .sort({ verifiedAt: -1 })
        .limit(5)
        .populate('testId', 'name code')
        .select('resultId testId verifiedAt')
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalResults,
          criticalResults,
          totalReports,
        },
        recentActivity: {
          orders: recentOrders,
          results: recentResults,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
