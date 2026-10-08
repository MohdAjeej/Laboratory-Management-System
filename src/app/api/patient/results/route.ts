import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import Patient from '@/models/Patient';
import { UserRole } from '@/lib/permissions';
import { ResultStatus } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/results
 * Fetch all test results for the authenticated patient
 * Only shows verified results
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

    // Only fetch verified results for patient view
    const results = await TestResult.find({ 
      patientId: patient._id,
      status: ResultStatus.VERIFIED
    })
      .populate('orderId', 'orderId')
      .populate('testId', 'name code category')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ verifiedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error fetching patient results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
