import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import User from '@/models/User';
import { UserRole } from '@/lib/permissions';
import { ResultStatus } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/pathologist/results/[id]/verify
 * Verify or reject a test result
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only pathologists and admins can verify results
    if (user.role !== UserRole.PATHOLOGIST && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { approve, clinicalSignificance } = body;

    await connectToDatabase();

    // Find the result
    const result = await TestResult.findById(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    // Find user document
    const userDoc = await User.findOne({ email: user.email });
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (approve) {
      // Verify the result
      if (clinicalSignificance) {
        result.clinicalSignificance = clinicalSignificance;
      }
      await result.verify(userDoc._id);
    } else {
      // Reject the result
      result.status = ResultStatus.REJECTED;
      result.addEvent('Result rejected by pathologist', userDoc._id);
      await result.save();
    }

    // Populate and return updated result
    const updatedResult = await TestResult.findById(id)
      .populate('orderId')
      .populate('sampleId')
      .populate('patientId')
      .populate('testId')
      .populate('verifiedBy');

    return NextResponse.json({
      success: true,
      message: approve ? 'Result verified successfully' : 'Result rejected',
      data: updatedResult,
    });
  } catch (error) {
    console.error('Error verifying result:', error);
    return NextResponse.json(
      { error: 'Failed to verify result' },
      { status: 500 }
    );
  }
}
