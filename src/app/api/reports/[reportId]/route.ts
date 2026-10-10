import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Report from '@/models/Report';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/[reportId]
 * Get report details or download PDF
 * Access: PATIENT (own reports), PATHOLOGIST, ADMIN
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { reportId } = params;
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';

    // Find report by reportId (e.g., "RPT-2024-000001")
    const report = await Report.findOne({ reportId })
      .populate('patientId')
      .populate('orderId')
      .populate('testResults')
      .populate('generatedBy')
      .populate('verifiedBy');

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Authorization check
    const patient = report.patientId as any;
    const isOwnReport = auth.user.role === 'PATIENT' && patient._id.toString() === auth.user.id.toString();
    const isAuthorized = ['PATHOLOGIST', 'ADMIN'].includes(auth.user.role) || isOwnReport;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You do not have permission to access this report' },
        { status: 403 }
      );
    }

    // Patients can only view published reports
    if (auth.user.role === 'PATIENT' && !['PUBLISHED', 'DOWNLOADED'].includes(report.status)) {
      return NextResponse.json(
        { error: 'Report is not yet available' },
        { status: 403 }
      );
    }

    // If download=true, return PDF file
    if (download) {
      if (!report.pdfUrl) {
        return NextResponse.json(
          { error: 'PDF not yet generated' },
          { status: 404 }
        );
      }

      const filepath = join(process.cwd(), 'public', report.pdfUrl);

      if (!existsSync(filepath)) {
        return NextResponse.json(
          { error: 'PDF file not found on server' },
          { status: 404 }
        );
      }

      const pdfBuffer = await readFile(filepath);

      // Record download
      await report.recordDownload(auth.user.id);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${reportId}-v${report.version}.pdf"`,
        },
      });
    }

    // Return report details
    const order = report.orderId as any;
    const generatedBy = report.generatedBy as any;
    const verifiedBy = report.verifiedBy as any;

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.reportId,
        _id: report._id,
        orderId: order.orderId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientId: patient.patientId || `PAT-${patient._id.toString().slice(-6)}`,
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
        notes: report.notes,
        signatures: report.signatures,
        events: report.events,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reports/[reportId]/verify
 * Verify a generated report
 * Access: PATHOLOGIST, ADMIN
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || !['PATHOLOGIST', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only pathologists and admins can verify reports.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { reportId } = params;
    const body = await req.json();
    const { action } = body;

    const report = await Report.findOne({ reportId });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (action === 'verify') {
      if (report.status !== 'GENERATED') {
        return NextResponse.json(
          { error: 'Only generated reports can be verified' },
          { status: 400 }
        );
      }

      await report.verify(
        auth.user.id,
        `${auth.user.firstName} ${auth.user.lastName}`,
        auth.user.role
      );

      return NextResponse.json({
        success: true,
        message: 'Report verified successfully',
        data: {
          reportId: report.reportId,
          status: report.status,
          verifiedBy: `${auth.user.firstName} ${auth.user.lastName}`,
          verifiedAt: report.verifiedAt,
        },
      });
    } else if (action === 'publish') {
      if (report.status !== 'VERIFIED') {
        return NextResponse.json(
          { error: 'Only verified reports can be published' },
          { status: 400 }
        );
      }

      await report.publish(auth.user.id);

      return NextResponse.json({
        success: true,
        message: 'Report published successfully',
        data: {
          reportId: report.reportId,
          status: report.status,
          publishedAt: report.publishedAt,
        },
      });
    } else if (action === 'revoke') {
      const { reason } = body;

      if (!reason) {
        return NextResponse.json(
          { error: 'Revocation reason is required' },
          { status: 400 }
        );
      }

      await report.revoke(auth.user.id, reason);

      return NextResponse.json({
        success: true,
        message: 'Report revoked successfully',
        data: {
          reportId: report.reportId,
          status: report.status,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Report action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action on report' },
      { status: 500 }
    );
  }
}
