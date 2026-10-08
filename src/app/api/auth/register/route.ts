import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Patient from '@/models/Patient';
import { UserRole } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';

// Validation schema for registration
const registerSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .max(255, 'Email must not exceed 255 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  agreeToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the terms and conditions'),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Parse and validate request body
    const body = await request.json();
    
    // Validate input data
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const { fullName, email, phone, password } = validationResult.data;

    // Split full name into first and last name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName; // Use first name as last name if only one name provided

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Check if phone number is already in use
    const existingPhone = await User.findOne({ phone: phone.replace(/\s/g, '') });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'This phone number is already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate unique user ID
    const userCount = await User.countDocuments();
    const userId = `PAT-${new Date().getFullYear()}-${(userCount + 1).toString().padStart(6, '0')}`;

    // Create user with PATIENT role (security: ignore any role supplied by client)
    const userData = {
      userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone.replace(/\s/g, ''), // Remove spaces from phone
      role: UserRole.PATIENT, // Force PATIENT role - never allow client to specify role
      isActive: true,
    };

    const user = new User(userData);
    await user.save();

    // Create patient profile
    const patientData = {
      patientId: `P-${new Date().getFullYear()}-${(userCount + 1).toString().padStart(6, '0')}`,
      firstName,
      lastName,
      // Use placeholder date for now - will be updated on first visit
      dateOfBirth: new Date('1990-01-01'), // Default placeholder
      gender: 'OTHER', // Default - will be updated on first visit
      phone: phone.replace(/\s/g, ''),
      email: email.toLowerCase(),
      address: {
        street: 'To be updated',
        city: 'To be updated',
        state: 'To be updated',
        zipCode: '000000',
        country: 'India',
      },
      emergencyContact: {
        name: 'To be updated',
        relationship: 'To be updated',
        phone: '0000000000',
      },
      medicalHistory: 'To be updated during first visit',
      allergies: 'To be updated during first visit',
      currentMedications: 'To be updated during first visit',
      isActive: true,
    };

    const patient = new Patient(patientData);
    await patient.save();

    // Create audit log for registration
    await auditUserAction(
      user._id,
      user.role,
      AuditAction.CREATE,
      'User',
      user._id.toString(),
      `User registered: ${user.email}`,
      {
        email: user.email,
        role: user.role,
        method: 'public_registration',
        patientId: patient.patientId,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    );

    // Return success response (exclude sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      patient: {
        id: patient._id,
        patientId: patient.patientId,
        createdAt: patient.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('E11000')) {
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 409 }
          );
        }
        if (error.message.includes('phone')) {
          return NextResponse.json(
            { error: 'This phone number is already registered' },
            { status: 409 }
          );
        }
        if (error.message.includes('userId')) {
          // Retry with a different userId if there's a collision (very rare)
          return NextResponse.json(
            { error: 'Registration failed. Please try again.' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}