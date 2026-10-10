/**
 * Verification Script for Hospital Management Setup
 * Run: npx ts-node scripts/verify-hospital-setup.ts
 */

import mongoose from 'mongoose';
import Hospital from '../src/models/Hospital';
import Doctor from '../src/models/Doctor';
import Order from '../src/models/Order';
import User from '../src/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lims';

async function verifySetup() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check Hospitals
    console.log('📋 Checking Hospitals...');
    const hospitals = await Hospital.find();
    console.log(`   Found ${hospitals.length} hospitals`);
    hospitals.forEach(h => {
      console.log(`   - ${h.name} (${h.code}) [${h.isActive ? 'Active' : 'Inactive'}]`);
    });
    if (hospitals.length === 0) {
      console.log('   ⚠️  No hospitals found. Run: npm run seed');
    }
    console.log('');

    // 2. Check Doctors
    console.log('👨‍⚕️ Checking Doctors...');
    const doctors = await Doctor.find().populate('hospitalIds', 'name code');
    console.log(`   Found ${doctors.length} doctors`);
    doctors.forEach(d => {
      const hospitalNames = (d.hospitalIds as any[])?.map((h: any) => h?.name).join(', ') || 'No hospitals';
      console.log(`   - Dr. ${d.firstName} ${d.lastName} (${d.specialization}) - ${hospitalNames}`);
    });
    console.log('');

    // 3. Check Orders with Hospital References
    console.log('📦 Checking Orders with Hospital References...');
    const ordersWithHospital = await Order.find({ hospitalId: { $exists: true, $ne: null } })
      .populate('hospitalId', 'name code')
      .populate('doctorId', 'firstName lastName');
    console.log(`   Found ${ordersWithHospital.length} orders with hospital references`);
    ordersWithHospital.slice(0, 5).forEach(o => {
      const hospital = (o.hospitalId as any)?.name || 'N/A';
      const doctor = o.doctorId ? `Dr. ${(o.doctorId as any).firstName} ${(o.doctorId as any).lastName}` : 'N/A';
      console.log(`   - ${o.orderId}: ${hospital} → ${doctor}`);
    });
    console.log('');

    // 4. Check Users and Roles
    console.log('👥 Checking Users by Role...');
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    userRoles.forEach(r => {
      console.log(`   - ${r._id}: ${r.count} user(s)`);
    });
    console.log('');

    // 5. Verify Doctor-Hospital Relationships
    console.log('🏥 Checking Doctor-Hospital Relationships...');
    const doctorsWithHospitals = await Doctor.countDocuments({ 
      hospitalIds: { $exists: true, $ne: [] } 
    });
    console.log(`   ${doctorsWithHospitals} doctors have hospital assignments`);
    
    const multiHospitalDoctors = await Doctor.find({ 
      $expr: { $gt: [{ $size: '$hospitalIds' }, 1] } 
    });
    if (multiHospitalDoctors.length > 0) {
      console.log(`   ${multiHospitalDoctors.length} doctor(s) assigned to multiple hospitals`);
      multiHospitalDoctors.forEach(d => {
        console.log(`     - Dr. ${d.firstName} ${d.lastName}: ${d.hospitalIds.length} hospitals`);
      });
    }
    console.log('');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Hospitals: ${hospitals.length}`);
    console.log(`   Active Hospitals: ${hospitals.filter(h => h.isActive).length}`);
    console.log(`   Doctors: ${doctors.length}`);
    console.log(`   Orders with Hospital: ${ordersWithHospital.length}`);
    console.log(`   Total Users: ${userRoles.reduce((sum, r) => sum + r.count, 0)}`);
    console.log('');

    // Recommendations
    console.log('✅ Setup Verification Complete!');
    console.log('');
    console.log('📝 Recommendations:');
    if (hospitals.length < 3) {
      console.log('   - Add more hospitals for testing');
    }
    if (doctors.length < 4) {
      console.log('   - Add more doctors for testing');
    }
    if (ordersWithHospital.length === 0) {
      console.log('   - Create test orders with hospital references');
    }
    if (multiHospitalDoctors.length === 0) {
      console.log('   - Assign some doctors to multiple hospitals');
    }
    console.log('');
    console.log('🚀 Ready to test at http://localhost:3000');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifySetup();
