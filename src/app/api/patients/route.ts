import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Patient from '@/models/Patient';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission, UserRole } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';
import { validatePatient } from '@/lib/validators/masterData';

// GET /api/patients — List patients with search/pagination
export const GET = withPermissionAuth(
  [Permission.READ_PATIENT],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search = searchParams.get('search') || '';
      const isActive = searchParams.get('isActive');
      const sort = searchParams.get('sort') || 'createdAt';
      const order = searchParams.get('order') === 'asc' ? 1 : -1;

      const query: any = {};

      if (search) {
        query.$or = [
          { patientId: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      if (isActive !== null && isActive !== '' && isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const skip = (page - 1) * limit;
      const sortObj: any = {};
      sortObj[sort] = order;

      const [patients, total] = await Promise.all([
        Patient.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Patient.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          patients,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      console.error('Get patients error:', error);
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
    }
  }
);

// POST /api/patients — Create patient (by staff)
export const POST = withPermissionAuth(
  [Permission.CREATE_PATIENT],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      // Validate input
      const validation = validatePatient(body);
      if (validation.hasErrors()) {
        return NextResponse.json({
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 400 });
      }

      // Enhanced duplicate detection with configurable matching
      const duplicateChecks = [];
      const potentialMatches: any[] = [];

      // 1. Exact phone match (high confidence)
      if (body.phone) {
        const phoneMatch = await Patient.findOne({ phone: body.phone, isActive: true });
        if (phoneMatch) {
          potentialMatches.push({
            confidence: 'HIGH',
            reason: 'Phone number match',
            patient: {
              patientId: phoneMatch.patientId,
              name: `${phoneMatch.firstName} ${phoneMatch.lastName}`,
              phone: phoneMatch.phone,
              email: phoneMatch.email,
              dateOfBirth: phoneMatch.dateOfBirth,
            },
          });
        }
      }

      // 2. Exact email match (high confidence)
      if (body.email) {
        const emailMatch = await Patient.findOne({ email: body.email, isActive: true });
        if (emailMatch && !potentialMatches.find(m => m.patient.patientId === emailMatch.patientId)) {
          potentialMatches.push({
            confidence: 'HIGH',
            reason: 'Email address match',
            patient: {
              patientId: emailMatch.patientId,
              name: `${emailMatch.firstName} ${emailMatch.lastName}`,
              phone: emailMatch.phone,
              email: emailMatch.email,
              dateOfBirth: emailMatch.dateOfBirth,
            },
          });
        }
      }

      // 3. Name + DOB match (medium confidence)
      if (body.firstName && body.lastName && body.dateOfBirth) {
        const namedobMatch = await Patient.findOne({
          firstName: { $regex: `^${body.firstName}$`, $options: 'i' },
          lastName: { $regex: `^${body.lastName}$`, $options: 'i' },
          dateOfBirth: new Date(body.dateOfBirth),
          isActive: true,
        });
        if (namedobMatch && !potentialMatches.find(m => m.patient.patientId === namedobMatch.patientId)) {
          potentialMatches.push({
            confidence: 'MEDIUM',
            reason: 'Name and date of birth match',
            patient: {
              patientId: namedobMatch.patientId,
              name: `${namedobMatch.firstName} ${namedobMatch.lastName}`,
              phone: namedobMatch.phone,
              email: namedobMatch.email,
              dateOfBirth: namedobMatch.dateOfBirth,
            },
          });
        }
      }

      // If duplicates found, return warning with all potential matches
      if (potentialMatches.length > 0) {
        return NextResponse.json({
          error: 'Possible duplicate patient(s) found',
          warning: 'Please review the following potential matches before creating a new patient',
          potentialMatches,
          action: 'If this is a new patient, you can force creation by adding ?force=true query parameter',
        }, { status: 409 });
      }

      // Generate patientId
      const count = await Patient.countDocuments();
      const patientId = `PAT-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;

      const patient = await Patient.create({ ...body, patientId });

      await auditUserAction(
        user.id, user.role, AuditAction.CREATE, 'Patient',
        patient.patientId,
        `Created patient: ${patient.firstName} ${patient.lastName}`
      );

      return NextResponse.json({ success: true, data: patient }, { status: 201 });
    } catch (error) {
      console.error('Create patient error:', error);
      return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
    }
  }
);
