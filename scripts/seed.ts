import { config } from 'dotenv';

// Load environment variables first
config({ path: '.env.local' });

import mongoose from 'mongoose';
import { hashPassword } from '../src/lib/auth';
import { UserRole } from '../src/lib/permissions';
import { Gender } from '../src/lib/validation';
import connectToDatabase from '../src/lib/mongodb';

// Import models
import User from '../src/models/User';
import Patient from '../src/models/Patient';
import Hospital from '../src/models/Hospital';
import Doctor from '../src/models/Doctor';
import Test from '../src/models/Test';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectToDatabase();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    await Test.deleteMany({});
    
    // Create Users
    console.log('👥 Creating users...');
    const hashedPassword = await hashPassword('Admin@123');
    
    const users = [
      {
        userId: 'USR-2026-000001',
        email: 'admin@lims.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        phone: '9876543200',
        isActive: true,
      },
      {
        userId: 'USR-2026-000002',
        email: 'labadmin@lims.com',
        password: hashedPassword,
        firstName: 'Lab',
        lastName: 'Administrator',
        role: UserRole.LAB_ADMIN,
        phone: '9876543201',
        isActive: true,
      },
      {
        userId: 'USR-2026-000003',
        email: 'receptionist@lims.com',
        password: hashedPassword,
        firstName: 'Reception',
        lastName: 'Staff',
        role: UserRole.RECEPTIONIST,
        phone: '9876543202',
        isActive: true,
      },
      {
        userId: 'USR-2026-000004',
        email: 'technician@lims.com',
        password: hashedPassword,
        firstName: 'Lab',
        lastName: 'Technician',
        role: UserRole.TECHNICIAN,
        phone: '9876543203',
        isActive: true,
      },
      {
        userId: 'USR-2026-000005',
        email: 'pathologist@lims.com',
        password: hashedPassword,
        firstName: 'Dr. Pathology',
        lastName: 'Specialist',
        role: UserRole.PATHOLOGIST,
        phone: '9876543204',
        isActive: true,
      },
      {
        userId: 'USR-2026-000006',
        email: 'accountant@lims.com',
        password: hashedPassword,
        firstName: 'Finance',
        lastName: 'Manager',
        role: UserRole.ACCOUNTANT,
        phone: '9876543205',
        isActive: true,
      },
    ];
    
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // Create Hospitals
    console.log('🏥 Creating hospitals...');
    const hospitals = [
      {
        hospitalId: 'HSP-2026-000001',
        name: 'City General Hospital',
        code: 'CGH',
        registrationNumber: 'REG001',
        contactPerson: 'Dr. John Manager',
        phone: '02212345678',
        email: 'contact@citygeneral.com',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India',
        },
        creditLimit: 100000,
        billingTerms: '30 days',
        isActive: true,
      },
      {
        hospitalId: 'HSP-2026-000002',
        name: 'Metro Medical Center',
        code: 'MMC',
        registrationNumber: 'REG002',
        contactPerson: 'Dr. Sarah Wilson',
        phone: '02212345679',
        email: 'info@metromedical.com',
        address: {
          street: '456 Health Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400002',
          country: 'India',
        },
        creditLimit: 150000,
        billingTerms: '45 days',
        isActive: true,
      },
      {
        hospitalId: 'HSP-2026-000003',
        name: 'Sunrise Healthcare',
        code: 'SHC',
        registrationNumber: 'REG003',
        contactPerson: 'Dr. Raj Patel',
        phone: '02212345680',
        email: 'admin@sunrisehc.com',
        address: {
          street: '789 Wellness Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400003',
          country: 'India',
        },
        creditLimit: 80000,
        billingTerms: '30 days',
        isActive: true,
      },
    ];
    
    const createdHospitals = [];
    for (const hospitalData of hospitals) {
      const hospital = await Hospital.create(hospitalData);
      createdHospitals.push(hospital);
    }
    console.log(`✅ Created ${createdHospitals.length} hospitals`);
    
    // Create Hospital Staff Users
    console.log('👨‍⚕️ Creating hospital staff...');
    const hospitalStaff = [
      {
        userId: 'USR-2026-000007',
        email: 'staff@citygeneral.com',
        password: hashedPassword,
        firstName: 'Hospital',
        lastName: 'Staff CGH',
        role: UserRole.HOSPITAL_STAFF,
        hospitalId: createdHospitals[0]._id,
        phone: '9876543206',
        isActive: true,
      },
      {
        userId: 'USR-2026-000008',
        email: 'staff@metromedical.com',
        password: hashedPassword,
        firstName: 'Hospital',
        lastName: 'Staff MMC',
        role: UserRole.HOSPITAL_STAFF,
        hospitalId: createdHospitals[1]._id,
        phone: '9876543207',
        isActive: true,
      },
    ];
    
    const createdStaff = [];
    for (const staffData of hospitalStaff) {
      const staff = await User.create(staffData);
      createdStaff.push(staff);
    }
    console.log(`✅ Created ${createdStaff.length} hospital staff`);
    
    // Create Patient Users (from registration)
    console.log('👤 Creating patient user accounts...');
    const patientUsers = [
      {
        userId: 'PAT-2026-000001',
        email: 'raj.patel@example.com',
        password: hashedPassword,
        firstName: 'Raj',
        lastName: 'Patel',
        role: UserRole.PATIENT,
        phone: '9876543208',
        isActive: true,
      },
      {
        userId: 'PAT-2026-000002',
        email: 'priya.singh@example.com',
        password: hashedPassword,
        firstName: 'Priya',
        lastName: 'Singh',
        role: UserRole.PATIENT,
        phone: '9876543209',
        isActive: true,
      },
    ];
    
    const createdPatientUsers = [];
    for (const patientUserData of patientUsers) {
      const patientUser = await User.create(patientUserData);
      createdPatientUsers.push(patientUser);
    }
    console.log(`✅ Created ${createdPatientUsers.length} patient users`);
    
    // Create Doctors
    console.log('👨‍⚕️ Creating doctors...');
    const doctors = [
      {
        doctorId: 'DOC-2026-000001',
        firstName: 'Dr. Amit',
        lastName: 'Kumar',
        registrationNumber: 'MED001',
        specialization: 'Internal Medicine',
        phone: '9876543216',
        email: 'amit.kumar@example.com',
        hospitalIds: [createdHospitals[0]._id, createdHospitals[1]._id],
        isActive: true,
      },
      {
        doctorId: 'DOC-2026-000002',
        firstName: 'Dr. Priya',
        lastName: 'Sharma',
        registrationNumber: 'MED002',
        specialization: 'Cardiology',
        phone: '9876543217',
        email: 'priya.sharma@example.com',
        hospitalIds: [createdHospitals[0]._id],
        isActive: true,
      },
      {
        doctorId: 'DOC-2026-000003',
        firstName: 'Dr. Rajesh',
        lastName: 'Gupta',
        registrationNumber: 'MED003',
        specialization: 'Orthopedics',
        phone: '9876543218',
        email: 'rajesh.gupta@example.com',
        hospitalIds: [createdHospitals[1]._id, createdHospitals[2]._id],
        isActive: true,
      },
      {
        doctorId: 'DOC-2026-000004',
        firstName: 'Dr. Sunita',
        lastName: 'Mehta',
        registrationNumber: 'MED004',
        specialization: 'Gynecology',
        phone: '9876543219',
        email: 'sunita.mehta@example.com',
        hospitalIds: [createdHospitals[2]._id],
        isActive: true,
      },
    ];
    
    const createdDoctors = [];
    for (const doctorData of doctors) {
      const doctor = await Doctor.create(doctorData);
      createdDoctors.push(doctor);
    }
    console.log(`✅ Created ${createdDoctors.length} doctors`);
    
    // Create Tests
    console.log('🧪 Creating tests...');
    const tests = [
      {
        testId: 'TST-2026-000001',
        name: 'Complete Blood Count (CBC)',
        code: 'CBC001',
        category: 'Hematology',
        department: 'Pathology',
        sampleType: 'Blood',
        turnaroundTime: 4,
        price: 300,
        parameters: [
          {
            name: 'Hemoglobin',
            unit: 'g/dL',
            referenceRange: { min: 12.0, max: 15.0 },
            criticalRange: { min: 7.0, max: 18.0 },
            displayOrder: 1,
            isActive: true,
          },
          {
            name: 'Total WBC Count',
            unit: '/cumm',
            referenceRange: { min: 4000, max: 10000 },
            criticalRange: { min: 2000, max: 20000 },
            displayOrder: 2,
            isActive: true,
          },
          {
            name: 'Platelet Count',
            unit: '/cumm',
            referenceRange: { min: 150000, max: 400000 },
            criticalRange: { min: 50000, max: 1000000 },
            displayOrder: 3,
            isActive: true,
          },
        ],
        isActive: true,
      },
      {
        testId: 'TST-2026-000002',
        name: 'Lipid Profile',
        code: 'LIP001',
        category: 'Biochemistry',
        department: 'Clinical Chemistry',
        sampleType: 'Serum',
        turnaroundTime: 6,
        price: 500,
        parameters: [
          {
            name: 'Total Cholesterol',
            unit: 'mg/dL',
            referenceRange: { max: 200 },
            criticalRange: { min: 0, max: 500 },
            displayOrder: 1,
            isActive: true,
          },
          {
            name: 'HDL Cholesterol',
            unit: 'mg/dL',
            referenceRange: { min: 40, max: 60 },
            displayOrder: 2,
            isActive: true,
          },
          {
            name: 'LDL Cholesterol',
            unit: 'mg/dL',
            referenceRange: { max: 100 },
            displayOrder: 3,
            isActive: true,
          },
          {
            name: 'Triglycerides',
            unit: 'mg/dL',
            referenceRange: { max: 150 },
            displayOrder: 4,
            isActive: true,
          },
        ],
        isActive: true,
      },
      {
        testId: 'TST-2026-000003',
        name: 'Liver Function Test (LFT)',
        code: 'LFT001',
        category: 'Biochemistry',
        department: 'Clinical Chemistry',
        sampleType: 'Serum',
        turnaroundTime: 4,
        price: 400,
        parameters: [
          {
            name: 'Total Bilirubin',
            unit: 'mg/dL',
            referenceRange: { min: 0.2, max: 1.2 },
            criticalRange: { min: 0, max: 10 },
            displayOrder: 1,
            isActive: true,
          },
          {
            name: 'SGPT (ALT)',
            unit: 'U/L',
            referenceRange: { min: 7, max: 56 },
            criticalRange: { min: 0, max: 200 },
            displayOrder: 2,
            isActive: true,
          },
          {
            name: 'SGOT (AST)',
            unit: 'U/L',
            referenceRange: { min: 10, max: 40 },
            criticalRange: { min: 0, max: 200 },
            displayOrder: 3,
            isActive: true,
          },
        ],
        isActive: true,
      },
      {
        testId: 'TST-2026-000004',
        name: 'Fasting Blood Sugar (FBS)',
        code: 'FBS001',
        category: 'Biochemistry',
        department: 'Clinical Chemistry',
        sampleType: 'Serum',
        turnaroundTime: 2,
        price: 150,
        parameters: [
          {
            name: 'Glucose (Fasting)',
            unit: 'mg/dL',
            referenceRange: { min: 70, max: 100 },
            criticalRange: { min: 40, max: 400 },
            displayOrder: 1,
            isActive: true,
          },
        ],
        isActive: true,
      },
      {
        testId: 'TST-2026-000005',
        name: 'Thyroid Function Test (TFT)',
        code: 'TFT001',
        category: 'Hormones',
        department: 'Immunoassay',
        sampleType: 'Serum',
        turnaroundTime: 24,
        price: 800,
        parameters: [
          {
            name: 'TSH',
            unit: 'mIU/L',
            referenceRange: { min: 0.4, max: 4.0 },
            displayOrder: 1,
            isActive: true,
          },
          {
            name: 'T3',
            unit: 'ng/dL',
            referenceRange: { min: 80, max: 200 },
            displayOrder: 2,
            isActive: true,
          },
          {
            name: 'T4',
            unit: 'μg/dL',
            referenceRange: { min: 5.1, max: 14.1 },
            displayOrder: 3,
            isActive: true,
          },
        ],
        isActive: true,
      },
    ];
    
    const createdTests = [];
    for (const testData of tests) {
      const test = await Test.create(testData);
      createdTests.push(test);
    }
    console.log(`✅ Created ${createdTests.length} tests`);
    
    // Create Patients (with link to user accounts)
    console.log('👤 Creating patient records...');
    const patients = [
      {
        patientId: 'P-2026-000001',
        userId: createdPatientUsers[0]._id,
        firstName: 'Raj',
        lastName: 'Patel',
        dateOfBirth: new Date('1985-03-15'),
        gender: Gender.MALE,
        phone: '9876543208',
        email: 'raj.patel@example.com',
        address: {
          street: '101 Patient Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India',
        },
        emergencyContact: {
          name: 'Sunita Patel',
          phone: '9876543221',
          relationship: 'Wife',
        },
        isActive: true,
      },
      {
        patientId: 'P-2026-000002',
        userId: createdPatientUsers[1]._id,
        firstName: 'Priya',
        lastName: 'Singh',
        dateOfBirth: new Date('1990-07-22'),
        gender: Gender.FEMALE,
        phone: '9876543209',
        email: 'priya.singh@example.com',
        address: {
          street: '202 Health Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400002',
          country: 'India',
        },
        isActive: true,
      },
      {
        patientId: 'P-2026-000003',
        firstName: 'Ahmed',
        lastName: 'Khan',
        dateOfBirth: new Date('1978-11-10'),
        gender: Gender.MALE,
        phone: '9876543223',
        address: {
          street: '303 Care Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400003',
          country: 'India',
        },
        emergencyContact: {
          name: 'Fatima Khan',
          phone: '9876543224',
          relationship: 'Wife',
        },
        medicalHistory: 'Diabetes Type 2, Hypertension. Regular follow-up required for diabetes management.',
        currentMedications: 'Metformin 500mg, Amlodipine 5mg',
        allergies: '',
        isActive: true,
      },
      {
        patientId: 'P-2026-000004',
        firstName: 'Lakshmi',
        lastName: 'Nair',
        dateOfBirth: new Date('1995-05-18'),
        gender: Gender.FEMALE,
        phone: '9876543225',
        email: 'lakshmi.nair@example.com',
        address: {
          street: '404 Wellness Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400004',
          country: 'India',
        },
        medicalHistory: '',
        currentMedications: '',
        allergies: 'Penicillin allergy',
        isActive: true,
      },
    ];
    
    const createdPatients = [];
    for (const patientData of patients) {
      const patient = await Patient.create(patientData);
      createdPatients.push(patient);
    }
    console.log(`✅ Created ${createdPatients.length} patients`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('==========================');
    console.log('Admin: admin@lims.com / Admin@123');
    console.log('Lab Admin: labadmin@lims.com / Admin@123');
    console.log('Receptionist: receptionist@lims.com / Admin@123');
    console.log('Technician: technician@lims.com / Admin@123');
    console.log('Pathologist: pathologist@lims.com / Admin@123');
    console.log('Accountant: accountant@lims.com / Admin@123');
    console.log('Hospital Staff (CGH): staff@citygeneral.com / Admin@123');
    console.log('Hospital Staff (MMC): staff@metromedical.com / Admin@123');
    console.log('Patient 1: raj.patel@example.com / Admin@123');
    console.log('Patient 2: priya.singh@example.com / Admin@123');
    
    console.log('\n📊 Created Data Summary:');
    console.log('========================');
    console.log(`Users: ${createdUsers.length + createdStaff.length + createdPatientUsers.length}`);
    console.log(`Hospitals: ${createdHospitals.length}`);
    console.log(`Doctors: ${createdDoctors.length}`);
    console.log(`Tests: ${createdTests.length}`);
    console.log(`Patients: ${createdPatients.length}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

seed();