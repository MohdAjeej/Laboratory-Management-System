import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Patient from '@/models/Patient';
import { UserRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/receptionist/patients/search
 * Search patients by ID, name, phone, or email
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

    // Only receptionists and admins can search patients
    if (user.role !== UserRole.RECEPTIONIST && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Search patients using the model's search method
    const patients = await Patient.searchPatients(query);

    return NextResponse.json({
      success: true,
      data: patients,
      count: patients.length,
    });
  } catch (error) {
    console.error('Error searching patients:', error);
    return NextResponse.json(
      { error: 'Failed to search patients' },
      { status: 500 }
    );
  }
}
