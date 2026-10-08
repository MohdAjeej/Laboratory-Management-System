import mongoose, { Document, Model, Schema } from 'mongoose';
import { Gender } from '@/lib/validation';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface IPatient extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: string; // Human-readable unique ID
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  phone: string;
  email?: string;
  address: IAddress;
  emergencyContact?: IEmergencyContact;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  fullName: string;
  age: number;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
}, { _id: false });

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
}, { _id: false });

const PatientSchema = new Schema<IPatient>({
  patientId: {
    type: String,
    unique: true,
    index: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: Object.values(Gender),
    required: true,
  },
  phone: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    lowercase: true,
    index: true,
  },
  address: {
    type: AddressSchema,
    required: true,
  },
  emergencyContact: {
    type: EmergencyContactSchema,
  },
  medicalHistory: {
    type: String,
  },
  allergies: {
    type: String,
  },
  currentMedications: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
PatientSchema.index({ patientId: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ email: 1 });
PatientSchema.index({ firstName: 1, lastName: 1 });
PatientSchema.index({ isActive: 1 });
PatientSchema.index({ createdAt: -1 });

// Virtual for full name
PatientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
PatientSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Pre-save middleware to generate patientId (will be implemented later)
// PatientSchema.pre('save', async function(next) {
//   if (this.isNew && !this.patientId) {
//     const count = await mongoose.model('Patient').countDocuments();
//     this.patientId = `PAT-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
//   }
//   next();
// });

// Static methods
PatientSchema.statics.findByPatientId = function(patientId: string) {
  return this.findOne({ patientId });
};

PatientSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ phone });
};

PatientSchema.statics.searchPatients = function(searchTerm: string) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { patientId: regex },
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
      { email: regex }
    ],
    isActive: true
  });
};

// Export interface for static methods
interface IPatientModel extends Model<IPatient> {
  findByPatientId(patientId: string): Promise<IPatient | null>;
  findByPhone(phone: string): Promise<IPatient | null>;
  searchPatients(searchTerm: string): Promise<IPatient[]>;
}

// Create and export model
const Patient: IPatientModel = (mongoose.models.Patient as IPatientModel) || 
  mongoose.model<IPatient, IPatientModel>('Patient', PatientSchema);

export default Patient;