import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Hospital from '@/models/Hospital';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/lib/permissions';

// GET /api/hospital/info - Get current hospital information
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    await connectToDatabase();

    // Check if user is hospital staff
    if (user.role !== UserRole.HOSPITAL_STAFF || !user.hospitalId) {
      return NextResponse.json(
        { error: 'Access denied - Hospital staff only' },
        { status: 403 }
      );
    }

    const hospital = await Hospital.findById(user.hospitalId).lean();

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error('Get hospital info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospital information' },
      { status: 500 }
    );
  }
});
