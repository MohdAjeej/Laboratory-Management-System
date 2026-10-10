import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Sample from '@/models/Sample';
import User from '@/models/User';
import { UserRole } from '@/lib/permissions';
import { SampleStatus } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/technician/samples/[id]/status
 * Update sample status
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

    // Only technicians and admins can update samples
    if (user.role !== UserRole.TECHNICIAN && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, rejectionReason, notes } = body;

    // Validate status
    if (!Object.values(SampleStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Reject requires reason
    if (status === SampleStatus.REJECTED && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the sample
    const sample = await Sample.findById(id);
    
    if (!sample) {
      return NextResponse.json(
        { error: 'Sample not found' },
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

    // Update status using the model method
    await sample.updateStatus(status, userDoc._id, rejectionReason, notes);

    // Populate and return updated sample
    const updatedSample = await Sample.findById(id)
      .populate('orderId')
      .populate('patientId');

    return NextResponse.json({
      success: true,
      message: 'Sample status updated successfully',
      data: updatedSample,
    });
  } catch (error) {
    console.error('Error updating sample status:', error);
    return NextResponse.json(
      { error: 'Failed to update sample status' },
      { status: 500 }
    );
  }
}
