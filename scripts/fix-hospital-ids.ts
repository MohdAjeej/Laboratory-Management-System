import mongoose from 'mongoose';
import Hospital from '../src/models/Hospital';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lims';

async function fixHospitalIds() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find all hospitals with null or missing hospitalId
    const hospitalsWithoutId = await Hospital.find({
      $or: [
        { hospitalId: null },
        { hospitalId: { $exists: false } },
        { hospitalId: '' }
      ]
    });

    console.log(`Found ${hospitalsWithoutId.length} hospitals without hospitalId`);

    if (hospitalsWithoutId.length === 0) {
      console.log('✓ All hospitals have valid hospitalIds');
      await mongoose.connection.close();
      return;
    }

    // Get the current highest number
    const allHospitals = await Hospital.find({ hospitalId: { $ne: null } })
      .sort({ hospitalId: -1 })
      .limit(1);
    
    let counter = 1;
    if (allHospitals.length > 0 && allHospitals[0].hospitalId) {
      const match = allHospitals[0].hospitalId.match(/HSP-\d{4}-(\d{6})/);
      if (match) {
        counter = parseInt(match[1]) + 1;
      }
    }

    // Update each hospital
    for (const hospital of hospitalsWithoutId) {
      const newHospitalId = `HSP-${new Date().getFullYear()}-${counter.toString().padStart(6, '0')}`;
      hospital.hospitalId = newHospitalId;
      await hospital.save();
      console.log(`✓ Updated ${hospital.name} → ${newHospitalId}`);
      counter++;
    }

    console.log(`✓ Successfully updated ${hospitalsWithoutId.length} hospitals`);
    await mongoose.connection.close();
    console.log('✓ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixHospitalIds();
