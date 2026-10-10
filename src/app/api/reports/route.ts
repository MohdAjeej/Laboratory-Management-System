import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports
 * List reports based on user role and filters
 * Access: PATIENT (own reports), PATHOLOGIST, ADMIN
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const orderId = searchParams.get('orderId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query: any = {};

    // Role-based filtering
    if (auth.user.role === 'PATIENT') {
      // Patients can only see their own published reports
      query.patientId = auth.user.id;
      query.status = { $in: ['PUBLISHED', 'DOWNLOADED'] };
    } else if (['PATHOLOGIST', 'ADMIN'].includes(auth.user.role)) {
      // Staff can see all reports
      if (status) {
        query.status = status;
      }
      if (patientId) {
        query.patientId = patientId;
      }
      if (orderId) {
        query.orderId = orderId;
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('patientId', 'firstName lastName patientId dateOfBirth gender')
        .populate('orderId', 'orderId status')
        .populate('generatedBy', 'firstName lastName role')
        .populate('verifiedBy', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(query),
    ]);

    const reportsData = reports.map((report) => {
      const patient = report.patientId as any;
      const order = report.orderId as any;
      const generatedBy = report.generatedBy as any;
      const verifiedBy = report.verifiedBy as any;

      return {
        reportId: report.reportId,
        _id: report._id,
        orderId: order?.orderId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        patientId: patient?.patientId,
        status: report.status,
        version: report.version,
        pdfUrl: report.pdfUrl,
        testResultCount: report.testResults.length,
        generatedAt: report.generatedAt,
        generatedBy: generatedBy ? `${generatedBy.firstName} ${generatedBy.lastName}` : null,
        verifiedAt: report.verifiedAt,
        verifiedBy: verifiedBy ? `${verifiedBy.firstName} ${verifiedBy.lastName}` : null,
        publishedAt: report.publishedAt,
        downloadCount: report.downloadedAt?.length || 0,
        createdAt: report.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        reports: reportsData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('List reports error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve reports' },
      { status: 500 }
    );
  }
}
