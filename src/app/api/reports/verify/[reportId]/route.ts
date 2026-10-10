import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/verify/[reportId]
 * Public endpoint to verify report authenticity via QR code
 * No authentication required - public verification portal
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    await connectToDatabase();

    const { reportId } = params;

    // Find report by reportId
    const report = await Report.findOne({ 
      reportId,
      status: { $in: ['PUBLISHED', 'DOWNLOADED'] } // Only show published reports
    })
      .populate('patientId', 'firstName lastName patientId dateOfBirth gender')
      .populate('orderId', 'orderId createdAt')
      .populate('verifiedBy', 'firstName lastName role')
      .populate('testResults');

    if (!report) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Report not found or not yet published',
          verified: false
        },
        { status: 404 }
      );
    }

    const patient = report.patientId as any;
    const order = report.orderId as any;
    const verifiedBy = report.verifiedBy as any;

    // Calculate patient age
    const calculateAge = (dob: Date) => {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Report is authentic and verified',
      data: {
        report: {
          reportId: report.reportId,
          version: report.version,
          status: report.status,
          generatedAt: report.generatedAt,
          publishedAt: report.publishedAt,
          pdfUrl: report.pdfUrl,
        },
        patient: {
          name: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.patientId || `PAT-${patient._id.toString().slice(-6)}`,
          age: calculateAge(patient.dateOfBirth),
          gender: patient.gender,
        },
        order: {
          orderId: order.orderId,
          collectionDate: order.createdAt,
        },
        verification: {
          verifiedBy: verifiedBy ? `${verifiedBy.firstName} ${verifiedBy.lastName}` : 'System',
          verifiedAt: report.verifiedAt,
          signatures: report.signatures.map((sig) => ({
            name: sig.name,
            role: sig.role,
            signedAt: sig.signedAt,
          })),
        },
        tests: {
          count: report.testResults.length,
        },
        downloadCount: report.downloadedAt?.length || 0,
      },
    });
  } catch (error) {
    console.error('Report verification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to verify report',
        verified: false 
      },
      { status: 500 }
    );
  }
}
