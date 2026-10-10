import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import Patient from '@/models/Patient';
import { UserRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/orders
 * Fetch all orders for the authenticated patient
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

    await connectToDatabase();

    // Find patient record by user email
    const patient = await Patient.findOne({ email: user.email });
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient record not found' },
        { status: 404 }
      );
    }

    // Fetch all orders for this patient
    const orders = await Order.find({ patientId: patient._id })
      .populate('hospitalId', 'name')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('items.testId', 'name code category')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('Error fetching patient orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
