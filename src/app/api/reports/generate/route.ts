import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';
import TestResult from '@/models/TestResult';
import Order from '@/models/Order';
import Patient from '@/models/Patient';
import Test from '@/models/Test';
import { generateLabReport } from '@/lib/pdf-generator';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/generate
 * Generate PDF report from verified test results
 * Access: PATHOLOGIST, ADMIN
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth || !['PATHOLOGIST', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only pathologists and admins can generate reports.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const { orderId, testResultIds, notes } = body;

    // Validate input
    if (!orderId || !testResultIds || !Array.isArray(testResultIds) || testResultIds.length === 0) {
      return NextResponse.json(
        { error: 'Order ID and test result IDs are required' },
        { status: 400 }
      );
    }

    // Fetch order with all related data
    const order = await Order.findById(orderId)
      .populate('patientId')
      .populate('hospitalId')
      .populate('doctorId');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch test results with test details
    const testResults = await TestResult.find({
      _id: { $in: testResultIds },
      orderId: orderId,
      status: 'VERIFIED',
    })
      .populate('testId')
      .populate('verifiedBy');

    if (testResults.length === 0) {
      return NextResponse.json(
        { error: 'No verified test results found for the provided IDs' },
        { status: 404 }
      );
    }

    if (testResults.length !== testResultIds.length) {
      return NextResponse.json(
        { error: 'Some test results are not verified or do not belong to this order' },
        { status: 400 }
      );
    }

    const patient = order.patientId as any;

    // Check if report already exists for this order
    let report = await Report.findOne({
      orderId: orderId,
      status: { $nin: ['REVOKED'] },
    });

    const isNewReport = !report;

    if (!report) {
      // Create new report
      report = new Report({
        orderId: orderId,
        patientId: patient._id,
        testResults: testResultIds,
        status: 'DRAFT',
        notes: notes,
      });
    } else {
      // Update existing report
      report.testResults = testResultIds;
      report.notes = notes;
      if (report.status === 'GENERATED' || report.status === 'VERIFIED') {
        // If regenerating a verified report, create new version
        report.version += 1;
        report.status = 'DRAFT';
        report.verifiedBy = undefined;
        report.verifiedAt = undefined;
      }
    }

    await report.save();

    // Transform data for PDF generation
    const reportData = {
      reportId: report.reportId,
      orderId: order.orderId,
      patientId: patient.patientId || `PAT-${patient._id.toString().slice(-6)}`,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientAge: patient.age || calculateAge(patient.dateOfBirth),
      patientGender: patient.gender,
      patientPhone: patient.phone,
      hospitalName: (order.hospitalId as any)?.name,
      doctorName: (order.doctorId as any)
        ? `Dr. ${(order.doctorId as any).firstName} ${(order.doctorId as any).lastName}`
        : undefined,
      collectionDate: order.createdAt,
      reportDate: new Date(),
      tests: testResults.map((result) => {
        const test = result.testId as any;
        return {
          testName: test.name,
          testCode: test.code,
          category: test.category,
          parameters: result.parameters.map((param) => ({
            name: param.name,
            value: param.value,
            unit: param.unit,
            referenceRange: param.referenceRange,
            flag: param.flag,
          })),
          comments: result.technicalComments,
        };
      }),
      verifiedBy: undefined, // Will be set after pathologist verification
      verifiedDate: undefined,
      technicalComments: notes,
      clinicalSignificance: testResults.find((r) => r.clinicalSignificance)?.clinicalSignificance,
    };

    // Generate PDF
    const pdfBuffer = await generateLabReport(reportData);

    // Save PDF to public directory
    const reportsDir = join(process.cwd(), 'public', 'reports');
    
    // Create directory if it doesn't exist
    if (!existsSync(reportsDir)) {
      await mkdir(reportsDir, { recursive: true });
    }

    const filename = `${report.reportId}-v${report.version}.pdf`;
    const filepath = join(reportsDir, filename);
    
    await writeFile(filepath, pdfBuffer);

    // Update report with PDF URL
    report.pdfUrl = `/reports/${filename}`;
    report.status = 'GENERATED';
    report.generatedBy = auth.user.id;
    report.generatedAt = new Date();
    
    await report.addEvent('Report generated', auth.user.id);

    return NextResponse.json({
      success: true,
      message: isNewReport ? 'Report generated successfully' : 'Report regenerated successfully',
      data: {
        reportId: report.reportId,
        reportMongoId: report._id,
        orderId: order.orderId,
        patientName: reportData.patientName,
        pdfUrl: report.pdfUrl,
        status: report.status,
        version: report.version,
        generatedAt: report.generatedAt,
        testCount: testResults.length,
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/generate?orderId=xxx
 * Get available test results for report generation
 * Access: PATHOLOGIST, ADMIN
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || !['PATHOLOGIST', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order
    const order = await Order.findById(orderId).populate('patientId');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch all verified test results for this order
    const testResults = await TestResult.find({
      orderId: orderId,
      status: 'VERIFIED',
    })
      .populate('testId')
      .populate('verifiedBy')
      .sort({ createdAt: -1 });

    // Check if report already exists
    const existingReport = await Report.findOne({
      orderId: orderId,
      status: { $nin: ['REVOKED'] },
    });

    const patient = order.patientId as any;

    return NextResponse.json({
      success: true,
      data: {
        order: {
          orderId: order.orderId,
          _id: order._id,
          status: order.status,
          createdAt: order.createdAt,
        },
        patient: {
          name: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.patientId || `PAT-${patient._id.toString().slice(-6)}`,
          age: patient.age || calculateAge(patient.dateOfBirth),
          gender: patient.gender,
        },
        testResults: testResults.map((result) => {
          const test = result.testId as any;
          const verifiedBy = result.verifiedBy as any;
          return {
            _id: result._id,
            resultId: result.resultId,
            testName: test.name,
            testCode: test.code,
            category: test.category,
            parameterCount: result.parameters.length,
            verifiedBy: verifiedBy ? `${verifiedBy.firstName} ${verifiedBy.lastName}` : 'Unknown',
            verifiedAt: result.verifiedAt,
            hasCritical: result.parameters.some((p) => p.flag === 'CRITICAL'),
            hasAbnormal: result.parameters.some((p) => ['ABNORMAL', 'HIGH', 'LOW'].includes(p.flag || '')),
          };
        }),
        existingReport: existingReport
          ? {
              reportId: existingReport.reportId,
              status: existingReport.status,
              version: existingReport.version,
              pdfUrl: existingReport.pdfUrl,
              generatedAt: existingReport.generatedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Fetch test results error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    );
  }
}

// Helper function to calculate age
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
