import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Models ───
import User from '../models/User';
import Patient from '../models/Patient';
import Hospital from '../models/Hospital';
import Doctor from '../models/Doctor';
import Test from '../models/Test';
import TestPackage from '../models/TestPackage';
import SystemSettings, { DEFAULT_SETTINGS } from '../models/SystemSettings';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lims';
const DEFAULT_PASSWORD = 'Admin@123';

async function seed() {
  console.log('🌱 Starting database seed...');
  console.log(`📦 Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ──────────────── System Settings ────────────────
  console.log('\n⚙️  Seeding system settings...');
  for (const [, setting] of Object.entries(DEFAULT_SETTINGS)) {
    await SystemSettings.findOneAndUpdate(
      { key: setting.key },
      { ...setting },
      { upsert: true, new: true }
    );
  }
  console.log('   ✅ System settings created');

  // ──────────────── Users ────────────────
  console.log('\n👤 Seeding users...');
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const users = [
    {
      userId: 'USR-2026-000001',
      email: 'admin@lims.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '9000000001',
      role: 'ADMIN',
      isActive: true,
    },
    {
      userId: 'USR-2026-000002',
      email: 'labadmin@lims.com',
      password: hashedPassword,
      firstName: 'Lab',
      lastName: 'Admin',
      phone: '9000000002',
      role: 'LAB_ADMIN',
      isActive: true,
    },
    {
      userId: 'USR-2026-000003',
      email: 'receptionist@lims.com',
      password: hashedPassword,
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '9000000003',
      role: 'RECEPTIONIST',
      isActive: true,
    },
    {
      userId: 'USR-2026-000004',
      email: 'technician@lims.com',
      password: hashedPassword,
      firstName: 'Rahul',
      lastName: 'Kumar',
      phone: '9000000004',
      role: 'TECHNICIAN',
      isActive: true,
    },
    {
      userId: 'USR-2026-000005',
      email: 'pathologist@lims.com',
      password: hashedPassword,
      firstName: 'Dr. Anjali',
      lastName: 'Verma',
      phone: '9000000005',
      role: 'PATHOLOGIST',
      isActive: true,
    },
    {
      userId: 'USR-2026-000006',
      email: 'accountant@lims.com',
      password: hashedPassword,
      firstName: 'Suresh',
      lastName: 'Patel',
      phone: '9000000006',
      role: 'ACCOUNTANT',
      isActive: true,
    },
    {
      userId: 'USR-2026-000007',
      email: 'hospitalstaff@lims.com',
      password: hashedPassword,
      firstName: 'Neha',
      lastName: 'Gupta',
      phone: '9000000007',
      role: 'HOSPITAL_STAFF',
      isActive: true,
    },
    {
      userId: 'PAT-2026-000008',
      email: 'patient@lims.com',
      password: hashedPassword,
      firstName: 'Amit',
      lastName: 'Singh',
      phone: '9000000008',
      role: 'PATIENT',
      isActive: true,
    },
  ];

  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
      await User.create(userData);
      console.log(`   ✅ Created user: ${userData.email} (${userData.role})`);
    } else {
      console.log(`   ⏭️  User already exists: ${userData.email}`);
    }
  }

  // ──────────────── Hospitals ────────────────
  console.log('\n🏥 Seeding hospitals...');
  const hospitals = [
    {
      hospitalId: 'HSP-2026-000001',
      name: 'City General Hospital',
      code: 'CGH',
      registrationNumber: 'REG-CGH-001',
      contactPerson: 'Dr. Rajesh Mehta',
      phone: '9100000001',
      email: 'admin@citygeneral.com',
      address: { street: '123 MG Road', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India' },
      creditLimit: 100000,
      billingTerms: '30 days',
      isActive: true,
    },
    {
      hospitalId: 'HSP-2026-000002',
      name: 'Metro Health Center',
      code: 'MHC',
      registrationNumber: 'REG-MHC-002',
      contactPerson: 'Dr. Sunita Reddy',
      phone: '9100000002',
      email: 'admin@metrohealth.com',
      address: { street: '456 Brigade Road', city: 'Bangalore', state: 'Karnataka', zipCode: '560001', country: 'India' },
      creditLimit: 75000,
      billingTerms: '15 days',
      isActive: true,
    },
    {
      hospitalId: 'HSP-2026-000003',
      name: 'Regional Medical Center',
      code: 'RMC',
      registrationNumber: 'REG-RMC-003',
      contactPerson: 'Dr. Arun Joshi',
      phone: '9100000003',
      email: 'admin@regionalmedical.com',
      address: { street: '789 Connaught Place', city: 'New Delhi', state: 'Delhi', zipCode: '110001', country: 'India' },
      creditLimit: 150000,
      billingTerms: '30 days',
      isActive: true,
    },
  ];

  const hospitalDocs: any[] = [];
  for (const hospitalData of hospitals) {
    let hospital = await Hospital.findOne({ code: hospitalData.code });
    if (!hospital) {
      hospital = await Hospital.create(hospitalData);
      console.log(`   ✅ Created hospital: ${hospitalData.name}`);
    } else {
      console.log(`   ⏭️  Hospital exists: ${hospitalData.name}`);
    }
    hospitalDocs.push(hospital);
  }

  // Link hospital staff user to first hospital
  const hospitalStaffUser = await User.findOne({ email: 'hospitalstaff@lims.com' });
  if (hospitalStaffUser && !hospitalStaffUser.hospitalId) {
    hospitalStaffUser.hospitalId = hospitalDocs[0]._id;
    await hospitalStaffUser.save();
    console.log(`   🔗 Linked hospital staff to ${hospitalDocs[0].name}`);
  }

  // ──────────────── Doctors ────────────────
  console.log('\n🩺 Seeding doctors...');
  const doctors = [
    {
      doctorId: 'DOC-2026-000001',
      firstName: 'Rajesh',
      lastName: 'Mehta',
      registrationNumber: 'MCI-12345',
      specialization: 'General Medicine',
      phone: '9200000001',
      email: 'rajesh.mehta@citygeneral.com',
      hospitalIds: [hospitalDocs[0]._id],
      isActive: true,
    },
    {
      doctorId: 'DOC-2026-000002',
      firstName: 'Sunita',
      lastName: 'Reddy',
      registrationNumber: 'KMC-67890',
      specialization: 'Cardiology',
      phone: '9200000002',
      email: 'sunita.reddy@metrohealth.com',
      hospitalIds: [hospitalDocs[1]._id],
      isActive: true,
    },
    {
      doctorId: 'DOC-2026-000003',
      firstName: 'Arun',
      lastName: 'Joshi',
      registrationNumber: 'DMC-11223',
      specialization: 'Endocrinology',
      phone: '9200000003',
      email: 'arun.joshi@regionalmedical.com',
      hospitalIds: [hospitalDocs[2]._id, hospitalDocs[0]._id],
      isActive: true,
    },
  ];

  for (const doctorData of doctors) {
    const existing = await Doctor.findOne({ registrationNumber: doctorData.registrationNumber });
    if (!existing) {
      await Doctor.create(doctorData);
      console.log(`   ✅ Created doctor: Dr. ${doctorData.firstName} ${doctorData.lastName}`);
    } else {
      console.log(`   ⏭️  Doctor exists: Dr. ${doctorData.firstName} ${doctorData.lastName}`);
    }
  }

  // ──────────────── Patients ────────────────
  console.log('\n🧑 Seeding patients...');
  const patients = [
    {
      patientId: 'P-2026-000001',
      firstName: 'Amit',
      lastName: 'Singh',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'MALE',
      phone: '9000000008',
      email: 'patient@lims.com',
      address: { street: '101 Park Street', city: 'Mumbai', state: 'Maharashtra', zipCode: '400002', country: 'India' },
      emergencyContact: { name: 'Priya Singh', phone: '9300000001', relationship: 'Spouse' },
      isActive: true,
    },
    {
      patientId: 'P-2026-000002',
      firstName: 'Meera',
      lastName: 'Nair',
      dateOfBirth: new Date('1985-11-22'),
      gender: 'FEMALE',
      phone: '9300000002',
      email: 'meera.nair@email.com',
      address: { street: '202 Lake View', city: 'Bangalore', state: 'Karnataka', zipCode: '560002', country: 'India' },
      emergencyContact: { name: 'Ravi Nair', phone: '9300000003', relationship: 'Husband' },
      isActive: true,
    },
  ];

  for (const patientData of patients) {
    const existing = await Patient.findOne({ patientId: patientData.patientId });
    if (!existing) {
      await Patient.create(patientData);
      console.log(`   ✅ Created patient: ${patientData.firstName} ${patientData.lastName}`);
    } else {
      console.log(`   ⏭️  Patient exists: ${patientData.firstName} ${patientData.lastName}`);
    }
  }

  // ──────────────── Tests ────────────────
  console.log('\n🧪 Seeding tests...');
  const tests = [
    {
      testId: 'TST-2026-000001', name: 'Complete Blood Count (CBC)', code: 'CBC',
      category: 'Hematology', department: 'Hematology', sampleType: 'EDTA Blood',
      turnaroundTime: 4, price: 450,
      parameters: [
        { name: 'Hemoglobin', unit: 'g/dL', referenceRange: { min: 12.0, max: 17.5 }, criticalRange: { min: 7.0, max: 20.0 }, displayOrder: 1, isActive: true },
        { name: 'WBC Count', unit: '×10³/µL', referenceRange: { min: 4.0, max: 11.0 }, criticalRange: { min: 2.0, max: 30.0 }, displayOrder: 2, isActive: true },
        { name: 'Platelet Count', unit: '×10³/µL', referenceRange: { min: 150, max: 400 }, criticalRange: { min: 50, max: 1000 }, displayOrder: 3, isActive: true },
        { name: 'RBC Count', unit: '×10⁶/µL', referenceRange: { min: 4.5, max: 5.5 }, displayOrder: 4, isActive: true },
        { name: 'Hematocrit', unit: '%', referenceRange: { min: 36, max: 54 }, displayOrder: 5, isActive: true },
      ],
    },
    {
      testId: 'TST-2026-000002', name: 'Blood Glucose Fasting', code: 'GLU-F',
      category: 'Biochemistry', department: 'Biochemistry', sampleType: 'Fluoride Blood',
      turnaroundTime: 2, price: 150,
      parameters: [
        { name: 'Glucose (Fasting)', unit: 'mg/dL', referenceRange: { min: 70, max: 100 }, criticalRange: { min: 40, max: 500 }, displayOrder: 1, isActive: true },
      ],
    },
    {
      testId: 'TST-2026-000003', name: 'Lipid Profile', code: 'LIPID',
      category: 'Biochemistry', department: 'Biochemistry', sampleType: 'Serum',
      turnaroundTime: 6, price: 800,
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: { min: 0, max: 200 }, displayOrder: 1, isActive: true },
        { name: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: { min: 40, max: 60 }, displayOrder: 2, isActive: true },
        { name: 'LDL Cholesterol', unit: 'mg/dL', referenceRange: { min: 0, max: 100 }, displayOrder: 3, isActive: true },
        { name: 'Triglycerides', unit: 'mg/dL', referenceRange: { min: 0, max: 150 }, displayOrder: 4, isActive: true },
        { name: 'VLDL', unit: 'mg/dL', referenceRange: { min: 0, max: 30 }, displayOrder: 5, isActive: true },
      ],
    },
    {
      testId: 'TST-2026-000004', name: 'Thyroid Profile (T3, T4, TSH)', code: 'THYROID',
      category: 'Endocrinology', department: 'Immunology', sampleType: 'Serum',
      turnaroundTime: 8, price: 950,
      parameters: [
        { name: 'T3 (Triiodothyronine)', unit: 'ng/dL', referenceRange: { min: 80, max: 200 }, displayOrder: 1, isActive: true },
        { name: 'T4 (Thyroxine)', unit: 'µg/dL', referenceRange: { min: 4.5, max: 12.5 }, displayOrder: 2, isActive: true },
        { name: 'TSH', unit: 'µIU/mL', referenceRange: { min: 0.4, max: 4.0 }, criticalRange: { min: 0.1, max: 10.0 }, displayOrder: 3, isActive: true },
      ],
    },
    {
      testId: 'TST-2026-000005', name: 'Liver Function Test (LFT)', code: 'LFT',
      category: 'Biochemistry', department: 'Biochemistry', sampleType: 'Serum',
      turnaroundTime: 6, price: 700,
      parameters: [
        { name: 'Bilirubin (Total)', unit: 'mg/dL', referenceRange: { min: 0.1, max: 1.2 }, criticalRange: { min: 0, max: 15 }, displayOrder: 1, isActive: true },
        { name: 'Bilirubin (Direct)', unit: 'mg/dL', referenceRange: { min: 0, max: 0.3 }, displayOrder: 2, isActive: true },
        { name: 'SGOT (AST)', unit: 'U/L', referenceRange: { min: 0, max: 40 }, displayOrder: 3, isActive: true },
        { name: 'SGPT (ALT)', unit: 'U/L', referenceRange: { min: 0, max: 40 }, displayOrder: 4, isActive: true },
        { name: 'Alkaline Phosphatase', unit: 'U/L', referenceRange: { min: 44, max: 147 }, displayOrder: 5, isActive: true },
        { name: 'Total Protein', unit: 'g/dL', referenceRange: { min: 6.0, max: 8.3 }, displayOrder: 6, isActive: true },
        { name: 'Albumin', unit: 'g/dL', referenceRange: { min: 3.5, max: 5.5 }, displayOrder: 7, isActive: true },
      ],
    },
    {
      testId: 'TST-2026-000006', name: 'Kidney Function Test (KFT)', code: 'KFT',
      category: 'Biochemistry', department: 'Biochemistry', sampleType: 'Serum',
      turnaroundTime: 6, price: 650,
      parameters: [
        { name: 'Urea', unit: 'mg/dL', referenceRange: { min: 15, max: 40 }, displayOrder: 1, isActive: true },
        { name: 'Creatinine', unit: 'mg/dL', referenceRange: { min: 0.6, max: 1.2 }, criticalRange: { min: 0, max: 10 }, displayOrder: 2, isActive: true },
        { name: 'Uric Acid', unit: 'mg/dL', referenceRange: { min: 3.5, max: 7.2 }, displayOrder: 3, isActive: true },
        { name: 'Sodium', unit: 'mEq/L', referenceRange: { min: 136, max: 145 }, criticalRange: { min: 120, max: 160 }, displayOrder: 4, isActive: true },
        { name: 'Potassium', unit: 'mEq/L', referenceRange: { min: 3.5, max: 5.0 }, criticalRange: { min: 2.5, max: 6.5 }, displayOrder: 5, isActive: true },
      ],
    },
    {
      testId: 'TST-2026-000007', name: 'Urine Routine & Microscopy', code: 'URINE-RM',
      category: 'Clinical Pathology', department: 'Clinical Pathology', sampleType: 'Urine',
      turnaroundTime: 2, price: 200,
      parameters: [
        { name: 'Color', unit: '', referenceRange: { text: 'Pale Yellow' }, displayOrder: 1, isActive: true },
        { name: 'pH', unit: '', referenceRange: { min: 4.6, max: 8.0 }, displayOrder: 2, isActive: true },
        { name: 'Specific Gravity', unit: '', referenceRange: { min: 1.005, max: 1.030 }, displayOrder: 3, isActive: true },
        { name: 'Protein', unit: '', referenceRange: { text: 'Nil' }, displayOrder: 4, isActive: true },
        { name: 'Glucose', unit: '', referenceRange: { text: 'Nil' }, displayOrder: 5, isActive: true },
      ],
    },
    {
      testId: 'TST-2026-000008', name: 'HbA1c (Glycated Hemoglobin)', code: 'HBA1C',
      category: 'Biochemistry', department: 'Biochemistry', sampleType: 'EDTA Blood',
      turnaroundTime: 4, price: 550,
      parameters: [
        { name: 'HbA1c', unit: '%', referenceRange: { min: 4.0, max: 5.6 }, displayOrder: 1, isActive: true },
      ],
    },
  ];

  const testDocs: any[] = [];
  for (const testData of tests) {
    let test = await Test.findOne({ code: testData.code });
    if (!test) {
      test = await Test.create(testData);
      console.log(`   ✅ Created test: ${testData.name}`);
    } else {
      console.log(`   ⏭️  Test exists: ${testData.name}`);
    }
    testDocs.push(test);
  }

  // ──────────────── Test Packages ────────────────
  console.log('\n📦 Seeding test packages...');
  const packages = [
    {
      packageId: 'PKG-2026-000001',
      name: 'Basic Health Checkup',
      code: 'BHC',
      description: 'Essential health screening package',
      category: 'Health Checkup',
      tests: [
        { testId: testDocs[0]._id, displayOrder: 1 }, // CBC
        { testId: testDocs[1]._id, displayOrder: 2 }, // Glucose Fasting
        { testId: testDocs[6]._id, displayOrder: 3 }, // Urine RM
      ],
      price: 599,
      individualTotal: 800,
      turnaroundTime: 6,
    },
    {
      packageId: 'PKG-2026-000002',
      name: 'Comprehensive Health Package',
      code: 'CHP',
      description: 'Full body health assessment including all major organ functions',
      category: 'Health Checkup',
      tests: [
        { testId: testDocs[0]._id, displayOrder: 1 }, // CBC
        { testId: testDocs[1]._id, displayOrder: 2 }, // Glucose
        { testId: testDocs[2]._id, displayOrder: 3 }, // Lipid
        { testId: testDocs[3]._id, displayOrder: 4 }, // Thyroid
        { testId: testDocs[4]._id, displayOrder: 5 }, // LFT
        { testId: testDocs[5]._id, displayOrder: 6 }, // KFT
        { testId: testDocs[6]._id, displayOrder: 7 }, // Urine
        { testId: testDocs[7]._id, displayOrder: 8 }, // HbA1c
      ],
      price: 2499,
      individualTotal: 4450,
      turnaroundTime: 12,
    },
    {
      packageId: 'PKG-2026-000003',
      name: 'Diabetes Panel',
      code: 'DIAB',
      description: 'Complete diabetes monitoring panel',
      category: 'Disease Panel',
      tests: [
        { testId: testDocs[1]._id, displayOrder: 1 }, // Glucose
        { testId: testDocs[7]._id, displayOrder: 2 }, // HbA1c
        { testId: testDocs[5]._id, displayOrder: 3 }, // KFT
        { testId: testDocs[2]._id, displayOrder: 4 }, // Lipid
      ],
      price: 1599,
      individualTotal: 2150,
      turnaroundTime: 8,
    },
  ];

  for (const pkgData of packages) {
    const existing = await TestPackage.findOne({ code: pkgData.code });
    if (!existing) {
      await TestPackage.create(pkgData);
      console.log(`   ✅ Created package: ${pkgData.name}`);
    } else {
      console.log(`   ⏭️  Package exists: ${pkgData.name}`);
    }
  }

  // ──────────────── Done ────────────────
  console.log('\n🎉 Database seeding completed!');
  console.log('\n📋 Demo Accounts:');
  console.log('   ┌────────────────────────────┬──────────────────┐');
  console.log('   │ Email                      │ Role             │');
  console.log('   ├────────────────────────────┼──────────────────┤');
  console.log('   │ admin@lims.com             │ ADMIN            │');
  console.log('   │ labadmin@lims.com          │ LAB_ADMIN        │');
  console.log('   │ receptionist@lims.com      │ RECEPTIONIST     │');
  console.log('   │ technician@lims.com        │ TECHNICIAN       │');
  console.log('   │ pathologist@lims.com       │ PATHOLOGIST      │');
  console.log('   │ accountant@lims.com        │ ACCOUNTANT       │');
  console.log('   │ hospitalstaff@lims.com     │ HOSPITAL_STAFF   │');
  console.log('   │ patient@lims.com           │ PATIENT          │');
  console.log('   └────────────────────────────┴──────────────────┘');
  console.log(`   Password for all: ${DEFAULT_PASSWORD}\n`);

  await mongoose.disconnect();
  console.log('📦 Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
