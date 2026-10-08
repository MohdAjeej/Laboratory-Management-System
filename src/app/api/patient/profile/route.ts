import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Patient from '@/models/Patient';
import User from '@/models/User';
import { UserRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/profile
 * Fetch profile information for the authenticated patient
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

    await connectDB();

    // Find patient record by user email
    const patient = await Patient.findOne({ email: user.email }).lean();
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient record not found' },
        { status: 404 }
      );
    }

    // Also get user account info
    const userAccount = await User.findOne({ email: user.email })
      .select('-password')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        patient,
        user: userAccount,
      },
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/patient/profile
 * Update profile information for the authenticated patient
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { phone, address, emergencyContact, medicalHistory, allergies, currentMedications } = body;

    await connectDB();

    // Find and update patient record
    const patient = await Patient.findOne({ email: user.email });
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient record not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (phone) patient.phone = phone;
    if (address) patient.address = address;
    if (emergencyContact) patient.emergencyContact = emergencyContact;
    if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;
    if (allergies !== undefined) patient.allergies = allergies;
    if (currentMedications !== undefined) patient.currentMedications = currentMedications;

    await patient.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: patient,
    });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
