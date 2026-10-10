import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import { UserRole } from '@/lib/permissions';
import { ResultStatus } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pathologist/results
 * Get test results for pathologist review
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

    // Only pathologists and admins can view results
    if (user.role !== UserRole.PATHOLOGIST && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    let query: any = {};
    
    // Filter by status - default to results needing review
    if (status) {
      query.status = status;
    } else {
      // Show submitted, abnormal, and critical results by default
      query.status = { 
        $in: [ResultStatus.SUBMITTED, ResultStatus.ABNORMAL, ResultStatus.CRITICAL] 
      };
    }

    const results = await TestResult.find(query)
      .populate('orderId', 'orderId')
      .populate('sampleId', 'sampleId barcode')
      .populate('patientId', 'patientId firstName lastName')
      .populate('testId', 'name code category')
      .populate('enteredBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await TestResult.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      total,
      hasMore: skip + results.length < total,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
