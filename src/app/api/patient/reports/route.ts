import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';
import Patient from '@/models/Patient';
import { UserRole } from '@/lib/permissions';
import { ReportStatus } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/reports
 * Fetch all reports for the authenticated patient
 * Only shows published reports
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

    // Only fetch published or downloaded reports for patient view
    const reports = await Report.find({ 
      patientId: patient._id,
      status: { $in: [ReportStatus.PUBLISHED, ReportStatus.DOWNLOADED] }
    })
      .populate('orderId', 'orderId')
      .populate({
        path: 'testResults',
        populate: {
          path: 'testId',
          select: 'name code category'
        }
      })
      .populate('verifiedBy', 'firstName lastName')
      .populate('publishedBy', 'firstName lastName')
      .sort({ publishedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: reports,
      count: reports.length,
    });
  } catch (error) {
    console.error('Error fetching patient reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
