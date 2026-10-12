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
import Supplier from '../src/models/Supplier';
import InventoryItem from '../src/models/InventoryItem';
import Equipment from '../src/models/Equipment';
import QCLot from '../src/models/QCLot';
import SystemSettings from '../src/models/SystemSettings';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('📦 Using idempotent seeding - checking for existing data...');
    
    await connectToDatabase();
    
    // Check if data already exists
    const userCount = await User.countDocuments();
    const hospitalCount = await Hospital.countDocuments();
    const testCount = await Test.countDocuments();
    
    if (userCount > 0 || hospitalCount > 0 || testCount > 0) {
      console.log('⚠️  Database already contains data:');
      console.log(`   - Users: ${userCount}`);
      console.log(`   - Hospitals: ${hospitalCount}`);
      console.log(`   - Tests: ${testCount}`);
      console.log('');
      console.log('Seeding will only create missing demo accounts and system settings.');
      console.log('To reset database, manually delete collections first.');
    } else {
      // Clear ALL existing data only if database is empty
      console.log('🧹 Database is empty - performing full seed...');
      await User.deleteMany({});
      await Patient.deleteMany({});
      await Hospital.deleteMany({});
      await Doctor.deleteMany({});
      await Test.deleteMany({});
      await Supplier.deleteMany({});
      await InventoryItem.deleteMany({});
      await Equipment.deleteMany({});
      await QCLot.deleteMany({});
    }
    
    // Create Users (idempotent - only create if not exists)
    console.log('👥 Creating/checking demo users...');
    const hashedPassword = await hashPassword('Admin@123');
    
    const usersData = [
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
    for (const userData of usersData) {
      // Check if user already exists
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        console.log(`  ✅ Created user: ${userData.email}`);
      } else {
        console.log(`  ⏭️  User already exists: ${userData.email}`);
      }
      createdUsers.push(user);
    }
    console.log(`✅ Total users: ${createdUsers.length}`);
    
    // Create Hospitals (idempotent)
    console.log('🏥 Creating/checking hospitals...');
    const hospitalsData = [
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
    for (const hospitalData of hospitalsData) {
      let hospital = await Hospital.findOne({ hospitalId: hospitalData.hospitalId });
      if (!hospital) {
        hospital = await Hospital.create(hospitalData);
        console.log(`  ✅ Created hospital: ${hospitalData.name}`);
      } else {
        console.log(`  ⏭️  Hospital already exists: ${hospitalData.name}`);
      }
      createdHospitals.push(hospital);
    }
    console.log(`✅ Total hospitals: ${createdHospitals.length}`);
    
    // Create Hospital Staff Users (idempotent)
    console.log('👨‍⚕️ Creating/checking hospital staff...');
    const hospitalStaffData = [
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
    for (const staffData of hospitalStaffData) {
      let staff = await User.findOne({ email: staffData.email });
      if (!staff) {
        staff = await User.create(staffData);
        console.log(`  ✅ Created hospital staff: ${staffData.email}`);
      } else {
        console.log(`  ⏭️  Hospital staff already exists: ${staffData.email}`);
      }
      createdStaff.push(staff);
    }
    console.log(`✅ Total hospital staff: ${createdStaff.length}`);
    
    // Create Patient Users (from registration) - idempotent
    console.log('👤 Creating/checking patient user accounts...');
    const patientUsersData = [
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
    for (const patientUserData of patientUsersData) {
      let patientUser = await User.findOne({ email: patientUserData.email });
      if (!patientUser) {
        patientUser = await User.create(patientUserData);
        console.log(`  ✅ Created patient user: ${patientUserData.email}`);
      } else {
        console.log(`  ⏭️  Patient user already exists: ${patientUserData.email}`);
      }
      createdPatientUsers.push(patientUser);
    }
    console.log(`✅ Total patient users: ${createdPatientUsers.length}`);
    
    // Create Doctors (idempotent)
    console.log('👨‍⚕️ Creating/checking doctors...');
    const doctorsData = [
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
    for (const doctorData of doctorsData) {
      let doctor = await Doctor.findOne({ doctorId: doctorData.doctorId });
      if (!doctor) {
        doctor = await Doctor.create(doctorData);
        console.log(`  ✅ Created doctor: ${doctorData.firstName} ${doctorData.lastName}`);
      } else {
        console.log(`  ⏭️  Doctor already exists: ${doctorData.firstName} ${doctorData.lastName}`);
      }
      createdDoctors.push(doctor);
    }
    console.log(`✅ Total doctors: ${createdDoctors.length}`);
    
    // Create Tests (idempotent)
    console.log('🧪 Creating/checking tests...');
    const testsData = [
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
    for (const testData of testsData) {
      let test = await Test.findOne({ testId: testData.testId });
      if (!test) {
        test = await Test.create(testData);
        console.log(`  ✅ Created test: ${testData.name}`);
      } else {
        console.log(`  ⏭️  Test already exists: ${testData.name}`);
      }
      createdTests.push(test);
    }
    console.log(`✅ Total tests: ${createdTests.length}`);
    
    // Create Patients (with link to user accounts) - idempotent
    console.log('👤 Creating/checking patient records...');
    const patientsData = [
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
    for (const patientData of patientsData) {
      let patient = await Patient.findOne({ patientId: patientData.patientId });
      if (!patient) {
        patient = await Patient.create(patientData);
        console.log(`  ✅ Created patient: ${patientData.firstName} ${patientData.lastName}`);
      } else {
        console.log(`  ⏭️  Patient already exists: ${patientData.firstName} ${patientData.lastName}`);
      }
      createdPatients.push(patient);
    }
    console.log(`✅ Total patients: ${createdPatients.length}`);
    
    // Create System Settings (idempotent - only create if not exists)
    console.log('⚙️  Creating/checking system settings...');
    let systemSettings = await SystemSettings.findOne();
    
    if (!systemSettings) {
      systemSettings = await SystemSettings.create({
        labInfo: {
          name: process.env.LAB_NAME || 'Modern Diagnostic Laboratory',
          code: 'MDL',
          registrationNumber: 'REG-2024-001',
          accreditation: 'NABL',
          address: '123 Healthcare Street, Medical District',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
          phone: '+91 22 1234 5678',
          email: 'info@modernlab.com',
          website: 'www.modernlab.com',
        },
        updatedBy: createdUsers[0]._id, // Admin user
      });
      console.log('  ✅ Created system settings');
    } else {
      console.log('  ⏭️  System settings already exist');
    }
    
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
    
    console.log('\n📊 Database Summary:');
    console.log('====================');
    console.log(`Users: ${await User.countDocuments()}`);
    console.log(`Hospitals: ${await Hospital.countDocuments()}`);
    console.log(`Doctors: ${await Doctor.countDocuments()}`);
    console.log(`Tests: ${await Test.countDocuments()}`);
    console.log(`Patients: ${await Patient.countDocuments()}`);
    console.log(`System Settings: ${systemSettings ? '1' : '0'}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

seed();